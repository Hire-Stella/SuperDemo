import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { load, type CheerioAPI } from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { gunzipSync } from 'node:zlib';
import type { ScrapedSite } from '@superdemo/contracts';

/**
 * Reads a website an operator pasted.
 *
 * ## The security problem this has, and how it is handled
 *
 * This is a server that fetches URLs chosen by a user. That is server-side
 * request forgery by default, and on a cloud host the payoff is immediate:
 * `http://169.254.169.254/latest/meta-data/iam/…` returns instance credentials
 * on AWS, `http://metadata.google.internal/` does the equivalent on GCP, and
 * `http://127.0.0.1:55432` is our own database. None of those are exotic — they
 * are the first three things anyone tries.
 *
 * So every URL is checked before it is fetched, and again after every redirect:
 *
 *  1. http/https only. `file://` reads the disk, `gopher://` can forge
 *     arbitrary TCP payloads.
 *  2. The hostname is resolved, and every address it resolves to must be
 *     public. Checking the literal is not enough — `localtest.me` and any
 *     attacker's own DNS record resolve to 127.0.0.1 by design.
 *  3. Redirects are followed manually, one at a time, re-checking each hop.
 *     `redirect: 'follow'` would let a public URL bounce to a private one
 *     inside a single fetch, with no opportunity to look.
 *
 * That applies to *every* request this class makes — robots.txt, sitemaps and
 * each page a sitemap names — not just the URL the operator typed. A sitemap
 * is attacker-controlled input exactly as much as the URL is: a site can list
 * `http://169.254.169.254/` in its sitemap as easily as on a form.
 *
 * A residual gap worth naming: between the DNS check and the connection, the
 * record could change (DNS rebinding). Closing it needs the socket pinned to
 * the vetted address, which Node's fetch does not expose. The window is
 * seconds, the attacker must control authoritative DNS, and the payoff is one
 * unauthenticated GET whose body is then handed to an LLM rather than returned.
 * Recorded here rather than left to be discovered.
 *
 * ## Which pages get read
 *
 * A homepage is often a hero image and three words. What a voice agent needs
 * — services, prices, opening hours — is one click away, so after the entry
 * page the site's own list of pages is consulted, in this order, stopping at
 * the first that names anything:
 *
 *  1. `Sitemap:` lines in robots.txt — the site telling us where its map is.
 *  2. The conventional sitemap locations (WordPress, Yoast and most builders).
 *  3. Links on the entry page, navigation first.
 *  4. A handful of guessed paths, which is what this used to do for everyone
 *     and which on most real sites hit nothing (`/services` is rarely where
 *     the services are; `/cyber-security/` is).
 *
 * The candidates are then ranked — pages that describe the business above
 * blog posts, legal boilerplate and shop machinery — and the top few read.
 */

/** A non-2xx answer, kept distinguishable so the entry fetch can react to it. */
class HttpStatusError extends BadRequestException {
  constructor(
    message: string,
    readonly upstreamStatus: number,
  ) {
    super(message);
  }
}

/**
 * The address is private. Never retried on a variant host — that would be the
 * scraper helpfully hunting for a way round its own guard.
 */
class UnsafeTargetError extends BadRequestException {}

type FetchKind = 'page' | 'xml' | 'robots';

interface FetchOpts {
  kind?: FetchKind;
  userAgent?: string;
  /** An outer budget, combined with the per-request timeout. */
  signal?: AbortSignal;
}

interface Fetched {
  body: string;
  finalUrl: URL;
}

interface RobotsRule {
  allow: boolean;
  pattern: string;
  re: RegExp;
}

interface Robots {
  sitemaps: string[];
  rules: RobotsRule[];
}

interface LdFacts {
  lines: string[];
  name: string;
  description: string;
  telephone: string | null;
}

/** Everything taken from one page, before cross-page cleaning. */
interface PageRead {
  url: URL;
  title: string;
  description: string;
  /** Cleaned visible text, one line per block, deduplicated within the page. */
  lines: string[];
  /**
   * Every line including chrome. Used only to count repeats across pages:
   * a page that fell back to lenient extraction keeps its menu in `lines`,
   * and its siblings' strict `lines` would not show that menu repeating.
   */
  allLines: Set<string>;
  ld: LdFacts;
  links: { href: string; nav: boolean }[];
  images: string[];
  tel: string | null;
  headings: string[];
  logo: string | null;
}

/** Minimal shape of a parsed DOM node; enough to walk it without domhandler's types. */
interface DomNode {
  type: string;
  name?: string;
  data?: string;
  children?: DomNode[];
}

@Injectable()
export class ScraperService {
  private readonly log = new Logger(ScraperService.name);

  private static readonly MAX_BYTES = 2_000_000;
  private static readonly TIMEOUT_MS = 12_000;
  private static readonly MAX_REDIRECTS = 4;
  /**
   * Enough for an LLM to characterise a business; far short of a token bill.
   * Thirteen pages at PAGE_TEXT each, roughly.
   */
  private static readonly MAX_TEXT = 40_000;
  /** Per-page share of `text`, so one long page cannot crowd out the rest. */
  private static readonly PAGE_TEXT = 3_000;
  /**
   * Per-page cap for `pages[]`. Larger than PAGE_TEXT because those become
   * knowledge documents an agent searches, not one prompt that is paid for
   * on every token.
   */
  private static readonly PAGE_KEEP = 10_000;
  /** Pages read beyond the entry point. */
  private static readonly EXTRA_PAGES = 12;
  private static readonly CONCURRENCY = 3;
  /** Wall-clock budget for all extra pages together. */
  private static readonly EXTRA_BUDGET_MS = 45_000;
  /** Wall-clock budget for robots.txt and sitemap discovery together. */
  private static readonly DISCOVERY_BUDGET_MS = 20_000;
  private static readonly MAX_SITEMAP_FETCHES = 8;
  private static readonly MAX_CHILD_SITEMAPS = 5;
  private static readonly MAX_SITEMAP_URLS = 5_000;
  /** Below this a page's text is treated as "nothing there". */
  private static readonly THIN_TEXT = 200;

  /**
   * Honest about who is asking. A site that would rather not be read can then
   * say so in robots.txt or block us by name.
   */
  private static readonly BOT_UA = 'HireStellaBot/1.0 (+contact centre onboarding)';
  /**
   * Used once, only for the entry page, only after a 403/429/503.
   *
   * Some WAFs (Cloudflare's bot fight mode, Sucuri, several hosting panels'
   * defaults) reject any user agent they do not recognise before the site
   * owner's own rules are consulted — so the refusal says nothing about what
   * the owner wants. The operator has been asked by that owner to set up
   * their contact centre; reading their public homepage as a browser would is
   * the request they are making. robots.txt is still honoured for every page
   * we choose ourselves.
   */
  private static readonly BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/130.0.0.0 Safari/537.36';
  private static readonly RETRY_AS_BROWSER = new Set([403, 429, 503]);

  /**
   * The old fixed list, now the last resort. Tried only when the site has no
   * sitemap and the entry page links nowhere (a JS-rendered shell, usually).
   */
  private static readonly GUESSED_PATHS = [
    '/about',
    '/about-us',
    '/services',
    '/courses',
    '/contact',
    '/contact-us',
  ];
  private static readonly SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'];

  /** Not web pages. Judged on the path, since sitemaps list media too. */
  private static readonly NON_PAGE =
    /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|heic|zip|rar|7z|gz|tgz|tar|bz2|mp[34]|m4[av]|wav|ogg|avi|mov|wmv|webm|mkv|docx?|xlsx?|pptx?|odt|ods|csv|txt|xml|json|rss|atom|css|js|mjs|map|exe|msi|dmg|apk|ipa|woff2?|ttf|otf|eot|ics|vcf)$/i;

  /** Words in a path that say "this page describes the business". */
  private static readonly GOOD_WORDS = new Set([
    'about', 'about-us', 'aboutus', 'who', 'company', 'overview',
    'service', 'services', 'solution', 'solutions', 'product', 'products',
    'course', 'courses', 'program', 'programs', 'programme', 'programmes',
    'pricing', 'prices', 'price', 'fees', 'fee', 'plan', 'plans', 'packages', 'rates',
    'contact', 'contacts', 'contact-us', 'faq', 'faqs', 'team', 'location', 'locations',
    'hours', 'menu', 'treatments', 'admissions',
  ]);
  /** Words that say "this page is about something else". Penalised, not banned. */
  private static readonly WEAK_WORDS = new Set([
    'blog', 'blogs', 'post', 'posts', 'news', 'press', 'media', 'events', 'event',
    'career', 'careers', 'job', 'jobs', 'vacancies', 'privacy', 'terms', 'cookie', 'cookies',
    'legal', 'disclaimer', 'policy', 'policies', 'refund', 'shipping', 'returns', 'gdpr',
    'tag', 'tags', 'category', 'categories', 'author', 'authors', 'archive', 'archives',
    'page', 'wp', 'feed', 'amp', 'attachment', 'portfolio', 'gallery', 'testimonial',
    'sitemap', 'patent', 'accessibility', 'press-coverage', 'press-releases',
  ]);
  /** Words that mean "no content here at all". Dropped outright. */
  private static readonly DEAD_WORDS = new Set([
    'cart', 'basket', 'checkout', 'login', 'logout', 'signin', 'signup', 'register',
    'account', 'my-account', 'wp-admin', 'wp-login', 'wp-json', 'wp-content', 'wp-includes',
    'feed', 'search', 'lost-password', 'xmlrpc',
  ]);

  /** Elements that are never readable text. */
  private static readonly NEVER_TEXT = 'script, style, noscript, svg, template, iframe, object, canvas';
  /** Page chrome, removed in the strict pass. */
  private static readonly CHROME =
    'nav, header, footer, aside, form, dialog, [role=navigation], [role=banner], ' +
    '[role=contentinfo], [aria-hidden=true], [hidden]';
  /** Elements that end a line of text. */
  private static readonly BLOCKS = new Set([
    'address', 'article', 'aside', 'blockquote', 'br', 'dd', 'details', 'div', 'dl', 'dt',
    'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
    'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'summary', 'table', 'td', 'th',
    'tr', 'ul', 'option', 'button', 'label', 'caption', 'fieldset', 'legend',
  ]);

  /** Reject before any DNS or network work. Cheap, and catches most of it. */
  private parseUrl(raw: string): URL {
    let url: URL;
    try {
      url = new URL(raw.trim());
    } catch {
      throw new BadRequestException('That is not a URL I can read');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('Only http and https addresses can be read');
    }
    if (url.username || url.password) {
      // Credentials in a URL are never right here and are a classic way to
      // confuse a naive host check (http://trusted@evil.example/).
      throw new BadRequestException('Remove the credentials from that URL');
    }
    return url;
  }

  /**
   * Is this address one the public internet can reach?
   *
   * Written as an allow-nothing-private check rather than a blocklist of known
   * metadata endpoints, because the blocklist is always one cloud provider out
   * of date.
   */
  private isPrivateAddress(addr: string): boolean {
    if (isIP(addr) === 6) {
      const v6 = addr.toLowerCase();
      // Loopback, unspecified, link-local, unique-local.
      if (v6 === '::1' || v6 === '::') return true;
      if (v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')) return true;
      // IPv4-mapped (::ffff:127.0.0.1) — unwrap and judge the v4 address.
      const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
      if (mapped?.[1]) return this.isPrivateAddress(mapped[1]);
      return false;
    }
    const parts = addr.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return true; // unparseable: refuse rather than guess
    }
    const [a, b] = parts as [number, number, number, number];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local — the metadata range
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier NAT
    if (a >= 224) return true; // multicast and reserved
    return false;
  }

  /** Resolve and vet every address the host answers with. */
  private async assertPublicHost(url: URL): Promise<void> {
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (isIP(host)) {
      if (this.isPrivateAddress(host)) {
        throw new UnsafeTargetError(`${host} is not a public address`);
      }
      return;
    }
    let addrs: { address: string }[];
    try {
      addrs = await lookup(host, { all: true });
    } catch {
      throw new BadRequestException(`Could not resolve ${host}`);
    }
    if (addrs.length === 0) throw new BadRequestException(`Could not resolve ${host}`);
    for (const { address } of addrs) {
      if (this.isPrivateAddress(address)) {
        // Named, because this is also what a misconfigured staging URL looks
        // like and the operator should be able to tell the two apart.
        throw new UnsafeTargetError(
          `${host} resolves to ${address}, which is a private address — I only read public sites`,
        );
      }
    }
  }

  /**
   * Fetch one URL, following redirects by hand so each hop is vetted.
   *
   * `kind` decides which content types are acceptable: pages must be HTML or
   * text, sitemaps may be XML (or gzip), robots.txt must be text. A sitemap
   * URL serving `application/xml` is right; a "page" serving it is not one.
   *
   * Returns the decoded body and the URL it ended up at.
   */
  private async fetchVetted(start: URL, opts: FetchOpts = {}): Promise<Fetched> {
    const kind = opts.kind ?? 'page';
    let url = start;
    for (let hop = 0; hop <= ScraperService.MAX_REDIRECTS; hop++) {
      await this.assertPublicHost(url);
      const timeout = AbortSignal.timeout(ScraperService.TIMEOUT_MS);
      const res = await fetch(url, {
        redirect: 'manual',
        signal: opts.signal ? AbortSignal.any([timeout, opts.signal]) : timeout,
        headers: {
          'user-agent': opts.userAgent ?? ScraperService.BOT_UA,
          accept:
            kind === 'page'
              ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              : kind === 'xml'
                ? 'application/xml,text/xml;q=0.9,*/*;q=0.5'
                : 'text/plain,*/*;q=0.5',
          'accept-language': 'en,*;q=0.5',
        },
      }).catch((e: unknown) => {
        throw new BadRequestException(
          `Could not read ${url.host} — ${e instanceof Error ? e.message : 'request failed'}`,
        );
      });

      if (res.status >= 300 && res.status < 400) {
        await res.body?.cancel().catch(() => undefined);
        const location = res.headers.get('location');
        if (!location) throw new BadRequestException(`${url.host} redirected to nowhere`);
        url = new URL(location, url);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new BadRequestException('That site redirects somewhere I will not follow');
        }
        continue;
      }
      if (!res.ok) {
        await res.body?.cancel().catch(() => undefined);
        throw new HttpStatusError(`${url.host} answered ${res.status}`, res.status);
      }
      const type = (res.headers.get('content-type') ?? '').toLowerCase();
      if (!this.acceptable(kind, type)) {
        await res.body?.cancel().catch(() => undefined);
        throw new BadRequestException(`${url.host} served ${type || 'no content type'}, not a web page`);
      }

      // Read with a hard ceiling rather than res.text(): a body advertised as
      // HTML can still be a gigabyte, and this runs on a shared worker.
      const raw = await this.readCapped(res);
      if (kind === 'xml' && raw[0] === 0x1f && raw[1] === 0x8b) {
        // sitemap.xml.gz. Inflated with the same ceiling — a gzip bomb is a
        // few kilobytes that become gigabytes, and this would otherwise
        // happily allocate them. Over the limit throws, and the caller skips.
        const inflated = gunzipSync(raw, { maxOutputLength: ScraperService.MAX_BYTES });
        return { body: inflated.toString('utf8'), finalUrl: url };
      }
      return { body: this.decodeBody(raw, type), finalUrl: url };
    }
    throw new BadRequestException('That site redirects too many times');
  }

  private acceptable(kind: FetchKind, type: string): boolean {
    // Missing content type: plenty of small hosts omit it. Let the body speak.
    if (!type) return true;
    if (kind === 'page') return type.includes('html') || type.includes('text');
    if (kind === 'robots') return type.startsWith('text/');
    // Sitemaps: XML of any flavour, plain text, or gzip. Not HTML — that is a
    // soft-404 page, and parsing it for <loc> would find nothing anyway.
    if (type.includes('html')) return false;
    return (
      type.includes('xml') ||
      type.startsWith('text/') ||
      type.includes('gzip') ||
      type.includes('octet-stream')
    );
  }

  private async readCapped(res: Response): Promise<Buffer> {
    const reader = res.body?.getReader();
    if (!reader) return Buffer.alloc(0);
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > ScraperService.MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        break;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }

  /**
   * Bytes to text in the encoding the site declared.
   *
   * Most of the web is UTF-8, but not the part this is pointed at: a
   * twenty-year-old family business site in windows-1252 or Shift_JIS is
   * exactly the kind of client this onboards, and decoding it as UTF-8 turns
   * every accented letter into a replacement character the LLM then quotes.
   * The header wins, then a `<meta charset>` or XML declaration in the first
   * few kilobytes, then UTF-8. An unknown label falls back to UTF-8 rather
   * than failing.
   */
  private decodeBody(raw: Buffer, contentType: string): string {
    let label = /charset\s*=\s*["']?([\w:.-]+)/i.exec(contentType)?.[1];
    if (!label) {
      const head = raw.subarray(0, 4096).toString('latin1');
      label =
        /<meta[^>]+charset\s*=\s*["']?([\w:.-]+)/i.exec(head)?.[1] ??
        /<\?xml[^>]+encoding\s*=\s*["']([\w:.-]+)["']/i.exec(head)?.[1];
    }
    if (label && !/^utf-?8$/i.test(label)) {
      try {
        return new TextDecoder(label).decode(raw);
      } catch {
        /* unknown label: fall through to UTF-8 */
      }
    }
    return new TextDecoder('utf-8').decode(raw);
  }

  /* -------------------------------- entry -------------------------------- */

  /**
   * The same site, spelled the other ways operators get it wrong.
   *
   * `www.` and the bare host are routinely only half configured — one of them
   * has no DNS record, or a certificate for the other name. Old sites on http
   * usually redirect to https, but some only answer one of the two.
   */
  private entryCandidates(url: URL): URL[] {
    const host = url.hostname;
    const literal = isIP(host.replace(/^\[|\]$/g, '')) !== 0;
    const alt = literal || !host.includes('.') ? null : host.startsWith('www.') ? host.slice(4) : `www.${host}`;
    const variant = (protocol: string, hostname: string): URL => {
      const u = new URL(url);
      u.protocol = protocol;
      u.hostname = hostname;
      return u;
    };
    const out = [url];
    if (alt) out.push(variant(url.protocol, alt));
    if (url.protocol === 'http:') {
      out.push(variant('https:', host));
      if (alt) out.push(variant('https:', alt));
    } else {
      // Last resort for a site whose certificate has lapsed. Still vetted
      // like everything else; plain http is no more dangerous to us.
      out.push(variant('http:', host));
    }
    const seen = new Set<string>();
    return out.filter((u) => !seen.has(u.toString()) && !!seen.add(u.toString()));
  }

  /**
   * The entry page, as forgivingly as possible.
   *
   * This is the one fetch whose failure fails the scrape, so it tries the
   * host variants above and, for each, once more as a browser if a WAF
   * refused the bot. The first error is the one reported — it is about the
   * URL the operator actually typed.
   */
  private async fetchEntry(url: URL): Promise<Fetched & { userAgent: string }> {
    const candidates = this.entryCandidates(url);
    let first: unknown;
    for (const candidate of candidates) {
      for (const userAgent of [ScraperService.BOT_UA, ScraperService.BROWSER_UA]) {
        try {
          const got = await this.fetchVetted(candidate, { kind: 'page', userAgent });
          if (candidate !== url) this.log.log(`entry ${url.host} unreadable; read ${candidate.host} instead`);
          return { ...got, userAgent };
        } catch (e) {
          // A private address on the URL as typed is a refusal, not a
          // transient failure, and the operator should see it as one.
          if (e instanceof UnsafeTargetError && candidate === url) throw e;
          first ??= e;
          const blocked =
            e instanceof HttpStatusError && ScraperService.RETRY_AS_BROWSER.has(e.upstreamStatus);
          if (userAgent === ScraperService.BOT_UA && blocked) continue;
          break;
        }
      }
    }
    throw first;
  }

  /* ------------------------------- robots -------------------------------- */

  /**
   * robots.txt, reduced to the rules that apply to us.
   *
   * A group naming HireStellaBot wins over `*`, as the standard says. Any
   * failure — 404, 5xx, timeout, garbage — means "no rules", which is how
   * every major crawler treats an unreachable robots.txt.
   */
  private async robots(base: URL, userAgent: string, signal: AbortSignal): Promise<Robots> {
    try {
      const { body } = await this.fetchVetted(new URL('/robots.txt', base), {
        kind: 'robots',
        userAgent,
        signal,
      });
      return this.parseRobots(body);
    } catch (e) {
      this.log.debug(`robots.txt for ${base.host} unreadable, treating as allow-all: ${this.why(e)}`);
      return { sitemaps: [], rules: [] };
    }
  }

  private parseRobots(txt: string): Robots {
    const sitemaps: string[] = [];
    const groups: { agents: string[]; rules: RobotsRule[] }[] = [];
    let current: { agents: string[]; rules: RobotsRule[] } | null = null;
    let lastWasAgent = false;
    for (const raw of txt.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z-]+)\s*:\s*(.*)$/.exec(raw.replace(/#.*$/, ''));
      if (!m) continue;
      const key = (m[1] ?? '').toLowerCase();
      const value = (m[2] ?? '').trim();
      if (key === 'sitemap') {
        if (value) sitemaps.push(value);
        continue;
      }
      if (key === 'user-agent') {
        if (!current || !lastWasAgent) {
          current = { agents: [], rules: [] };
          groups.push(current);
        }
        current.agents.push(value.toLowerCase());
        lastWasAgent = true;
        continue;
      }
      lastWasAgent = false;
      if (!current || (key !== 'allow' && key !== 'disallow')) continue;
      // An empty Disallow means "everything is allowed" — no rule at all.
      if (!value) continue;
      current.rules.push({ allow: key === 'allow', pattern: value, re: this.robotsPattern(value) });
    }
    const ours = groups.filter((g) => g.agents.some((a) => a !== '*' && a.includes('hirestella')));
    const chosen = ours.length > 0 ? ours : groups.filter((g) => g.agents.includes('*'));
    return { sitemaps, rules: chosen.flatMap((g) => g.rules) };
  }

  /** `*` wildcards and a trailing `$` anchor, as Google and Bing implement them. */
  private robotsPattern(pattern: string): RegExp {
    const anchored = pattern.endsWith('$');
    const body = (anchored ? pattern.slice(0, -1) : pattern)
      .split('*')
      .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${body}${anchored ? '$' : ''}`);
  }

  /** Longest matching rule wins; on a tie, Allow wins. No rule: allowed. */
  private robotsAllow(url: URL, robots: Robots): boolean {
    const path = url.pathname + url.search;
    let best: RobotsRule | null = null;
    for (const rule of robots.rules) {
      if (!rule.re.test(path)) continue;
      if (
        !best ||
        rule.pattern.length > best.pattern.length ||
        (rule.pattern.length === best.pattern.length && rule.allow)
      ) {
        best = rule;
      }
    }
    return best ? best.allow : true;
  }

  /* ------------------------------ discovery ------------------------------ */

  /**
   * Every page URL the sitemaps reachable from `starts` list.
   *
   * Indexes are followed two levels deep and at most five children each,
   * preferring children that sound like pages: a Yoast index lists
   * page-sitemap.xml next to post-, product- and category- sitemaps that can
   * run to thousands of entries, and the 44 pages are the useful ones.
   */
  private async readSitemaps(starts: URL[], userAgent: string, signal: AbortSignal): Promise<string[]> {
    const urls: string[] = [];
    let fetches = 0;
    const visit = async (u: URL, depth: number): Promise<void> => {
      if (signal.aborted || fetches >= ScraperService.MAX_SITEMAP_FETCHES) return;
      if (urls.length >= ScraperService.MAX_SITEMAP_URLS) return;
      fetches++;
      let body: string;
      try {
        body = (await this.fetchVetted(u, { kind: 'xml', userAgent, signal })).body;
      } catch (e) {
        this.log.debug(`sitemap ${u} skipped: ${this.why(e)}`);
        return;
      }
      const locs = this.locs(body);
      if (/<(?:[\w-]+:)?sitemapindex[\s>]/i.test(body)) {
        if (depth >= 2) return;
        const children = locs
          .map((loc, i) => ({ loc, i, rank: this.sitemapRank(loc) }))
          .sort((a, b) => a.rank - b.rank || a.i - b.i)
          .slice(0, ScraperService.MAX_CHILD_SITEMAPS);
        for (const { loc } of children) {
          let child: URL;
          try {
            child = new URL(loc, u);
          } catch {
            continue;
          }
          await visit(child, depth + 1);
        }
        return;
      }
      for (const loc of locs) {
        if (urls.length >= ScraperService.MAX_SITEMAP_URLS) break;
        urls.push(loc);
      }
    };
    for (const s of starts) await visit(s, 0);
    return urls;
  }

  /** `<loc>` values. Regex, because sitemaps are flat and namespaces vary. */
  private locs(xml: string): string[] {
    const out: string[] = [];
    // Unprefixed <loc> only: `<image:loc>` inside a urlset is an image, not a page.
    for (const m of xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<]*?)\s*(?:\]\]>)?\s*<\/loc>/gi)) {
      const v = this.decode(m[1] ?? '').trim();
      if (v) out.push(v);
    }
    return out;
  }

  /** Lower is better: page sitemaps first, then the unknown, then the bulk ones. */
  private sitemapRank(loc: string): number {
    const l = loc.toLowerCase();
    if (/page/.test(l)) return 0;
    if (/post|product|categor|tag|author|blog|news|image|video|attachment|archive|event|portfolio/.test(l)) {
      return 2;
    }
    return 1;
  }

  /**
   * Candidate pages, from the first source that names any.
   *
   * "Names any" is judged after filtering, so a sitemap that lists only PDFs
   * or another domain's pages falls through to the next source rather than
   * leaving us with nothing.
   */
  private async discover(
    base: URL,
    entry: PageRead,
    robots: Robots,
    userAgent: string,
    signal: AbortSignal,
  ): Promise<{ source: string; urls: URL[] }> {
    /*
     * The entry page's navigation links ride along with any sitemap.
     *
     * A sitemap says what exists, not what matters: squarespace.com's lists
     * hundreds of press items ahead of a single product page, and ranking by
     * path words alone then reads twelve press clippings. The site's own menu
     * is its owner's answer to "what matters", so those links compete too,
     * with the nav bonus. They do not count towards "this source yielded
     * something" — only the sitemap's own URLs do.
     */
    const nav = new Set(entry.links.filter((l) => l.nav).map((l) => l.href));
    const tryList = (found: string[]) =>
      this.rank(found, base, robots).length > 0 ? this.rank([...found, ...nav], base, robots, nav) : [];

    if (robots.sitemaps.length > 0) {
      const starts = robots.sitemaps.flatMap((s) => {
        try {
          return [new URL(s, base)];
        } catch {
          return [];
        }
      });
      const urls = tryList(await this.readSitemaps(starts, userAgent, signal));
      if (urls.length > 0) return { source: 'robots.txt sitemap', urls };
    }

    for (const path of ScraperService.SITEMAP_PATHS) {
      if (signal.aborted) break;
      const urls = tryList(await this.readSitemaps([new URL(path, base)], userAgent, signal));
      if (urls.length > 0) return { source: path, urls };
    }

    const linked = this.rank(
      entry.links.map((l) => l.href),
      base,
      robots,
      nav,
    );
    if (linked.length > 0) return { source: 'entry page links', urls: linked };

    return {
      source: 'guessed paths',
      urls: tryList(ScraperService.GUESSED_PATHS.map((p) => new URL(p, base).toString())),
    };
  }

  private siteKey(host: string): string {
    return host.toLowerCase().replace(/^www\./, '');
  }

  private pathKey(u: URL): string {
    return (u.pathname.replace(/\/+$/, '') || '/') + u.search;
  }

  /**
   * Filter, dedupe and order candidate URLs, best first.
   *
   * Same site only (www. and bare count as one), pages only, no fragments,
   * nothing robots.txt disallows, and a `?query` variant dropped when the
   * plain path is also listed — that is a tracking or sort parameter, not a
   * different page.
   */
  private rank(raw: string[], base: URL, robots: Robots, nav?: Set<string>): URL[] {
    const site = this.siteKey(base.hostname);
    const entryKey = this.pathKey(base);
    const parsed: { url: URL; order: number; nav: boolean }[] = [];
    raw.forEach((r, order) => {
      let u: URL;
      try {
        u = new URL(r, base);
      } catch {
        return;
      }
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      if (u.username || u.password) return;
      if (this.siteKey(u.hostname) !== site) return;
      if (ScraperService.NON_PAGE.test(u.pathname)) return;
      u.hash = '';
      // Same site, so ask for it the way the site answered — saves a redirect hop.
      u.protocol = base.protocol;
      u.hostname = base.hostname;
      u.port = base.port;
      if (this.pathKey(u) === entryKey) return;
      if (!this.robotsAllow(u, robots)) return;
      parsed.push({ url: u, order, nav: nav?.has(r) ?? false });
    });

    const plain = new Set(parsed.filter((p) => !p.url.search).map((p) => this.pathKey(p.url)));
    const seen = new Set<string>();
    const scored: { url: URL; order: number; score: number }[] = [];
    for (const p of parsed) {
      const key = this.pathKey(p.url);
      if (seen.has(key)) continue;
      if (p.url.search && plain.has(p.url.pathname.replace(/\/+$/, '') || '/')) continue;
      seen.add(key);
      const score = this.score(p.url, p.nav);
      if (score === null) continue;
      scored.push({ url: p.url, order: p.order, score });
    }
    return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((s) => s.url);
  }

  /**
   * How likely a URL is to describe the business. `null`: not worth a fetch.
   *
   * Path words, not page content — this runs before anything is fetched and
   * has to choose 12 of possibly hundreds. Shallow paths get a lift because a
   * site's structure puts its main pages near the root; dated paths
   * (/2024/05/…) are posts whatever they are called.
   */
  private score(u: URL, nav: boolean): number | null {
    let path = u.pathname.toLowerCase();
    try {
      path = decodeURIComponent(path);
    } catch {
      /* malformed escape: score the raw path */
    }
    const segments = path.split('/').filter(Boolean);
    const words = new Set<string>();
    for (const seg of segments) {
      words.add(seg);
      for (const w of seg.split(/[-_.]+/)) if (w) words.add(w);
    }
    for (const w of words) if (ScraperService.DEAD_WORDS.has(w)) return null;
    if (u.searchParams.has('s') || u.searchParams.has('replytocom') || u.searchParams.has('add-to-cart')) {
      return null;
    }

    let score = 0;
    if ([...words].some((w) => ScraperService.GOOD_WORDS.has(w))) score += 10;
    if ([...words].some((w) => ScraperService.WEAK_WORDS.has(w) || w.startsWith('wp-'))) score -= 15;
    if (/\/(19|20)\d{2}\/(0?[1-9]|1[0-2])(\/|$)/.test(path) || /\/(19|20)\d{2}\//.test(path)) score -= 15;
    score -= 2 * Math.max(0, segments.length - 1);
    if (u.search) score -= 3;
    if (nav) score += 3;
    return score;
  }

  private isContact(u: URL): boolean {
    return /(^|[/\-_])contact/i.test(u.pathname);
  }

  /** Top N, with a contact page guaranteed a place if the site has one. */
  private pick(ranked: URL[]): URL[] {
    const n = ScraperService.EXTRA_PAGES;
    const top = ranked.slice(0, n);
    if (!top.some((u) => this.isContact(u))) {
      const contact = ranked.find((u) => this.isContact(u));
      if (contact) {
        if (top.length >= n) top.pop();
        top.push(contact);
      }
    }
    return top;
  }

  /* ------------------------------ extraction ----------------------------- */

  /**
   * Basic entity decoding, for strings that did not come through the HTML
   * parser: sitemap `<loc>` values and JSON-LD strings, both of which carry
   * `&amp;` in the wild. Attribute and text values from cheerio are already
   * decoded and must not be decoded twice.
   */
  private decode(s: string): string {
    return s
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
      .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)));
  }

  private why(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  private meta($: CheerioAPI, names: string[]): string {
    const found = new Map<string, string>();
    $('meta').each((_, el) => {
      const $m = $(el);
      const key = ($m.attr('name') ?? $m.attr('property') ?? $m.attr('itemprop') ?? '').toLowerCase();
      const content = ($m.attr('content') ?? '').trim();
      if (key && content && !found.has(key)) found.set(key, content);
    });
    for (const name of names) {
      const v = found.get(name);
      if (v) return v;
    }
    return '';
  }

  /**
   * Visible text, one line per block element.
   *
   * Strict mode removes page chrome — navigation, header, footer, cookie
   * banners — because those repeat on every page and would otherwise be most
   * of what the LLM reads. Some sites put their entire content inside
   * <header> or a <form>, though, and strict mode reads those as empty; the
   * caller then retries in lenient mode, which only drops what is never text.
   *
   * The walk is done by hand rather than with `.text()`, which runs adjacent
   * blocks together ("ServicesAboutContact") and loses the line structure the
   * cross-page deduplication depends on.
   */
  private textLines(html: string, strict: boolean): string[] {
    const $ = load(html);
    $(ScraperService.NEVER_TEXT).remove();
    if (strict) {
      $(ScraperService.CHROME).remove();
      $('[id], [class]').each((_, el) => {
        const $el = $(el);
        const sig = `${$el.attr('id') ?? ''} ${$el.attr('class') ?? ''}`;
        if (!/cookie|consent|gdpr/i.test(sig)) return;
        // Guarded: `<body class="cookie-banner-active">` is not a banner,
        // and neither is a wrapper holding the whole page.
        if ($el.is('html, body, main') || $el.text().length > 3000) return;
        $el.remove();
      });
    }

    const lines: string[] = [];
    let cur = '';
    const flush = () => {
      const line = cur.replace(/\s+/g, ' ').trim();
      if (line && /[\p{L}\p{N}]/u.test(line)) lines.push(line);
      cur = '';
    };
    const walk = (node: DomNode): void => {
      if (node.type === 'text') {
        cur += node.data ?? '';
        return;
      }
      if (node.type !== 'tag' && node.type !== 'root') return;
      const block = node.name ? ScraperService.BLOCKS.has(node.name) : false;
      if (block) flush();
      for (const child of node.children ?? []) walk(child);
      if (block) flush();
      else if (node.name === 'a' || node.name === 'td') cur += ' ';
    };
    const body = $('body')[0] ?? $.root()[0];
    if (body) walk(body as unknown as DomNode);
    flush();

    // Exact repeats within a page: carousels and responsive duplicates.
    return [...new Set(lines)];
  }

  /**
   * Structured data the site publishes about itself.
   *
   * JSON-LD survives where nothing else does: a JS-rendered site ships an
   * empty <div id="root"> but its SEO plugin still emits a LocalBusiness block
   * with name, phone, address and hours — the four facts a voice agent most
   * needs. Only those fields are taken; the rest of schema.org is noise here.
   */
  private jsonLd($: CheerioAPI): LdFacts {
    const out: LdFacts = { lines: [], name: '', description: '', telephone: null };
    const skip = /^(BreadcrumbList|ListItem|ImageObject|SearchAction|ReadAction|Person|EntryPoint)$/i;
    const str = (v: unknown): string => (typeof v === 'string' ? this.decode(v).replace(/\s+/g, ' ').trim() : '');
    const add = (line: string) => {
      const value = line.slice(line.indexOf(': ') + 2);
      if (/[\p{L}\p{N}]/u.test(value) && !out.lines.includes(line)) out.lines.push(line);
    };
    // Name and description only from nodes that describe the business or the
    // site. A FAQPage's Questions and a HowTo's steps also have names, and
    // read as a list of non-sequiturs when lifted out of context.
    const describesBusiness = (type: string) =>
      !type ||
      /Organization|Corporation|Business|Store|Shop|School|College|University|Restaurant|Cafe|Bakery|Service|Place|Clinic|Dentist|Physician|Hospital|Hotel|Lodging|Agency|Office|WebSite|Product|Course/i.test(
        type,
      );
    const address = (a: unknown): string => {
      if (typeof a === 'string') return str(a);
      if (!a || typeof a !== 'object') return '';
      const o = a as Record<string, unknown>;
      const country = typeof o.addressCountry === 'object' && o.addressCountry
        ? str((o.addressCountry as Record<string, unknown>).name)
        : str(o.addressCountry);
      return [o.streetAddress, o.addressLocality, o.addressRegion, o.postalCode]
        .map(str)
        .concat(country)
        .filter(Boolean)
        .join(', ');
    };
    const day = (d: unknown): string => str(d).replace(/^https?:\/\/schema\.org\//i, '');
    const visit = (v: unknown, depth: number): void => {
      if (depth > 5 || !v || typeof v !== 'object') return;
      if (Array.isArray(v)) {
        for (const x of v) visit(x, depth + 1);
        return;
      }
      const o = v as Record<string, unknown>;
      visit(o['@graph'], depth + 1);
      visit(o.mainEntity, depth + 1);
      const type = Array.isArray(o['@type']) ? str(o['@type'][0]) : str(o['@type']);
      if (skip.test(type)) return;
      const named = describesBusiness(type);
      const name = named ? str(o.name) : '';
      const description = named ? str(o.description) : '';
      const tel = str(o.telephone);
      if (name) add(`Name: ${name}`);
      if (description) add(`About: ${description}`);
      if (tel) add(`Telephone: ${tel}`);
      const addrs = (Array.isArray(o.address) ? o.address : [o.address]).map(address).filter(Boolean);
      for (const a of addrs) add(`Address: ${a}`);
      const hours = (Array.isArray(o.openingHours) ? o.openingHours : [o.openingHours]).map(str).filter(Boolean);
      if (hours.length) add(`Opening hours: ${hours.join('; ')}`);
      const spec = Array.isArray(o.openingHoursSpecification)
        ? o.openingHoursSpecification
        : o.openingHoursSpecification
          ? [o.openingHoursSpecification]
          : [];
      const specLines = spec
        .map((s) => {
          if (!s || typeof s !== 'object') return '';
          const r = s as Record<string, unknown>;
          const days = (Array.isArray(r.dayOfWeek) ? r.dayOfWeek : [r.dayOfWeek]).map(day).filter(Boolean);
          const opens = str(r.opens);
          const closes = str(r.closes);
          return days.length && (opens || closes) ? `${days.join(', ')} ${opens}–${closes}` : '';
        })
        .filter(Boolean);
      if (specLines.length) add(`Opening hours: ${specLines.join('; ')}`);
      // An organisation's name beats a WebPage's, which is just the title.
      if (name && (!out.name || /Organization|Business|Store|School|Restaurant|Service/i.test(type))) {
        out.name = name;
      }
      if (description && !out.description) out.description = description;
      if (tel && !out.telephone) out.telephone = tel;
    };
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        visit(JSON.parse($(el).text()), 0);
      } catch {
        /* malformed JSON-LD is common; ignore the block */
      }
    });
    return out;
  }

  /**
   * A phone number, if the page offers one.
   *
   * `tel:` links first — a number someone deliberately made dialable is far
   * more likely to be the business's own than the first digit run in the text,
   * which is regularly a price, a licence number or a year.
   */
  private phone($: CheerioAPI): string | null {
    let found: string | null = null;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (!/^tel:/i.test(href)) return;
      const cleaned = this.cleanPhone(href.slice(4));
      if (cleaned) {
        found = cleaned;
        return false;
      }
      return;
    });
    return found;
  }

  private cleanPhone(raw: string): string | null {
    let s = raw;
    try {
      s = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    const cleaned = s.replace(/[^\d+]/g, '');
    return cleaned.replace(/\D/g, '').length >= 7 ? cleaned : null;
  }

  private headings($: CheerioAPI): string[] {
    const out: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const t = $(el).text().replace(/\s+/g, ' ').trim();
      if (t && t.length < 140 && !out.includes(t)) out.push(t);
      if (out.length >= 24) return false;
      return;
    });
    return out;
  }

  /**
   * Large images on the page, for the templates' image bands.
   *
   * Filtered rather than taken wholesale: sprites, tracking pixels, icons and
   * logos outnumber photographs on a marketing page, and a 32px favicon
   * stretched across a hero band looks worse than no band at all. The filters
   * are crude on purpose — dimension hints in the markup, and a path that does
   * not read as chrome — because the consumer is a decorative band where a
   * wrong choice is ugly rather than incorrect.
   *
   * `srcset` is preferred where present, since its largest candidate is what a
   * full-width band actually wants. Lazy-loading attributes (`data-src`) are
   * read too: on many builders `src` is a 1px placeholder until JS runs.
   *
   * Attribute values come out of cheerio already entity-decoded. That matters:
   * a src of `?width=1376&amp;height=768` sent with the entity intact comes
   * back 400 from the CDN, which once broke every image on every template at
   * once and looked like a design problem rather than a parsing one.
   */
  private galleryImages($: CheerioAPI, base: URL): string[] {
    const out: string[] = [];
    const junk = /sprite|icon|favicon|logo|badge|avatar|pixel|tracking|1x1|placeholder|\.svg(\?|$)/i;

    $('img').each((_, el) => {
      const $img = $(el);
      const srcset = $img.attr('srcset') ?? $img.attr('data-srcset');
      let candidate = $img.attr('src') ?? '';
      const lazy = $img.attr('data-src') ?? $img.attr('data-lazy-src') ?? '';
      if (lazy && (!candidate || candidate.startsWith('data:'))) candidate = lazy;
      if (srcset) {
        const best = srcset
          .split(',')
          .map((part) => part.trim().split(/\s+/))
          .map(([url, w]) => ({ url: url ?? '', w: Number((w ?? '').replace(/\D/g, '')) || 0 }))
          .sort((a, b) => b.w - a.w)[0];
        if (best?.url) candidate = best.url;
      }
      candidate = candidate.trim();
      if (!candidate || candidate.startsWith('data:')) return;
      if (junk.test(candidate)) return;

      // Prefer things the markup says are big. Where it says nothing, keep it —
      // a photograph without a width attribute is still usually a photograph.
      const dim = (v: string | undefined) => {
        const n = parseInt(v ?? '', 10);
        return n >= 10 ? n : 0;
      };
      const w = dim($img.attr('width'));
      const h = dim($img.attr('height'));
      if ((w && w < 400) || (h && h < 220)) return;

      try {
        const u = new URL(candidate, base);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
        const clean = u.toString();
        if (!out.includes(clean)) out.push(clean);
      } catch {
        /* unparseable src, skip */
      }
      if (out.length >= 12) return false;
      return;
    });
    return out;
  }

  private image($: CheerioAPI, base: URL): string | null {
    let candidate = this.meta($, ['og:image', 'og:image:url', 'twitter:image']);
    if (!candidate) {
      const icons = $('link[rel][href]')
        .toArray()
        .map((el) => ({ rel: ($(el).attr('rel') ?? '').toLowerCase(), href: $(el).attr('href') ?? '' }));
      candidate =
        icons.find((i) => i.rel.includes('apple-touch-icon'))?.href ??
        icons.find((i) => i.rel.split(/\s+/).includes('icon'))?.href ??
        '';
    }
    if (!candidate) return null;
    try {
      const u = new URL(candidate.trim(), base);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
    } catch {
      return null;
    }
  }

  /** Read everything this class wants from one HTML document. */
  private readPage(html: string, url: URL): PageRead {
    const $ = load(html);
    let lines = this.textLines(html, true);
    const lenient = this.textLines(html, false);
    if (lines.join('\n').length < ScraperService.THIN_TEXT && lenient.join('\n').length > lines.join('\n').length) {
      lines = lenient;
    }
    const links: { href: string; nav: boolean }[] = [];
    $('a[href]').each((_, el) => {
      const $a = $(el);
      const href = ($a.attr('href') ?? '').trim();
      if (!href || /^(mailto|tel|javascript|data):/i.test(href) || href.startsWith('#')) return;
      links.push({ href, nav: $a.closest('nav, header, [role=navigation]').length > 0 });
    });
    links.sort((a, b) => Number(b.nav) - Number(a.nav));
    return {
      url,
      allLines: new Set(lenient),
      title: $('title').first().text().replace(/\s+/g, ' ').trim(),
      description: this.meta($, ['description', 'og:description', 'twitter:description']),
      lines,
      ld: this.jsonLd($),
      links,
      images: this.galleryImages($, url),
      tel: this.phone($),
      headings: this.headings($),
      logo: this.image($, url),
    };
  }

  /**
   * Fetch the chosen pages, three at a time, inside one overall budget.
   *
   * Every failure is skipped: a 404, a timeout, a WAF, a page that redirects
   * off-site. The entry page has already succeeded, so the scrape has
   * something; each page here only adds to it.
   */
  private async readExtras(urls: URL[], base: URL, userAgent: string): Promise<PageRead[]> {
    const deadline = AbortSignal.timeout(ScraperService.EXTRA_BUDGET_MS);
    const results: (PageRead | null)[] = urls.map(() => null);
    let next = 0;
    const worker = async (): Promise<void> => {
      while (!deadline.aborted) {
        const i = next++;
        const target = urls[i];
        if (!target) return;
        try {
          const got = await this.fetchVetted(target, { kind: 'page', userAgent, signal: deadline });
          if (this.siteKey(got.finalUrl.hostname) !== this.siteKey(base.hostname)) {
            this.log.debug(`${target} left the site for ${got.finalUrl.host}; skipped`);
            continue;
          }
          results[i] = this.readPage(got.body, got.finalUrl);
        } catch (e) {
          this.log.debug(`extra page ${target} skipped: ${this.why(e)}`);
        }
      }
    };
    await Promise.all(Array.from({ length: ScraperService.CONCURRENCY }, () => worker()));
    return results.filter((r): r is PageRead => r !== null);
  }

  /** Lines joined until `max` characters, without cutting a line in half. */
  private clip(lines: string[], max: number): string {
    const out: string[] = [];
    let len = 0;
    for (const line of lines) {
      if (len + line.length + 1 > max) {
        if (out.length === 0) out.push(line.slice(0, max));
        break;
      }
      out.push(line);
      len += line.length + 1;
    }
    return out.join('\n');
  }

  /**
   * Vet a URL without fetching it.
   *
   * Exists so the checks run at the request boundary as well as in the job.
   * Without it an operator pasting `http://127.0.0.1` gets a 202 and finds out
   * it failed by watching a status field, and the outbox spends eight retries
   * on a URL that can never work. Throws the same BadRequestException the
   * scrape would, so the two paths give identical messages.
   *
   * The job still re-checks. This is the fast, friendly rejection; that one is
   * the guarantee, and it has to stay because DNS can change in between.
   */
  async assertReadable(rawUrl: string): Promise<void> {
    await this.assertPublicHost(this.parseUrl(rawUrl));
  }

  /**
   * Read a site.
   *
   * The entry page is required — if it cannot be read there is nothing to
   * generate from, and the operator should be told. Everything after it is
   * best-effort: robots.txt, sitemaps and each extra page that loads adds
   * detail, and each one that does not is silently skipped.
   *
   * robots.txt is deliberately *not* applied to the entry URL. The operator
   * chose that page explicitly, on behalf of the business that owns it; a
   * blanket `Disallow: /` aimed at search crawlers is not that business
   * saying "do not read my homepage to the person setting up my phone line".
   * Every page we pick ourselves does respect it.
   */
  async scrape(rawUrl: string): Promise<ScrapedSite> {
    const url = this.parseUrl(rawUrl);
    const entryFetch = await this.fetchEntry(url);
    const base = entryFetch.finalUrl;
    const entry = this.readPage(entryFetch.body, base);

    // Extra pages go out with whichever user agent got the entry page through.
    // If the WAF refused the bot on the homepage it will refuse it on /about.
    const ua = entryFetch.userAgent;
    let extras: PageRead[] = [];
    let source = 'none';
    try {
      const discoverySignal = AbortSignal.timeout(ScraperService.DISCOVERY_BUDGET_MS);
      const robots = await this.robots(base, ua, discoverySignal);
      const found = await this.discover(base, entry, robots, ua, discoverySignal);
      source = found.source;
      const chosen = this.pick(found.urls);
      this.log.debug(`${base.host}: ${found.urls.length} candidate(s) from ${source}; reading ${chosen.length}`);
      extras = await this.readExtras(chosen, base, ua);
    } catch (e) {
      // Nothing above should throw, but the entry page is in hand and nothing
      // optional is allowed to cost the operator that.
      this.log.warn(`extra pages for ${base.host} abandoned: ${this.why(e)}`);
    }

    // Drop extras that are the same page under another URL (redirects, or a
    // site that answers every unknown path with its homepage).
    const seenUrls = new Set([this.pathKey(base)]);
    const seenOpenings = new Set([entry.lines.join('\n').slice(0, 400)]);
    extras = extras.filter((p) => {
      const key = this.pathKey(p.url);
      const opening = p.lines.join('\n').slice(0, 400);
      if (seenUrls.has(key) || (opening.length > 100 && seenOpenings.has(opening))) return false;
      if (p.lines.join('').length < 80) return false;
      seenUrls.add(key);
      seenOpenings.add(opening);
      return true;
    });

    // Menus, footers and newsletter blurbs that escaped the chrome strip:
    // anything on three or more pages is boilerplate, not content.
    const all = [entry, ...extras];
    const counts = new Map<string, number>();
    for (const p of all) {
      for (const l of new Set([...p.lines, ...p.allLines])) counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    const content = (p: PageRead) => p.lines.filter((l) => (counts.get(l) ?? 0) < 3);

    // The entry page also carries what a JS-rendered site still ships in its
    // HTML: <title>, meta description and JSON-LD.
    const ogDescription = this.meta(load(entryFetch.body), ['og:description']);
    const header = [
      entry.title,
      entry.description,
      ogDescription !== entry.description ? ogDescription : '',
      // A WebPage node's name and description are the title and meta
      // description again; only keep JSON-LD lines that add something.
      ...entry.ld.lines.filter((l) => {
        const value = l.slice(l.indexOf(': ') + 2);
        return value !== entry.title && value !== entry.description && value !== ogDescription;
      }),
    ].filter((l, i, arr) => l && arr.indexOf(l) === i);
    const entryLines = [...header, ...content(entry).filter((l) => !header.includes(l))];

    const pages = [
      { url: base.toString(), title: entry.title, text: this.clip(entryLines, ScraperService.PAGE_KEEP) },
      ...extras.map((p) => ({
        url: p.url.toString(),
        title: p.title,
        text: this.clip(content(p), ScraperService.PAGE_KEEP),
      })),
    ].filter((p, i) => i === 0 || p.text.length > 0);

    const text = [
      this.clip(entryLines, ScraperService.PAGE_TEXT + 1_000),
      ...extras.map((p) => {
        const body = this.clip(content(p), ScraperService.PAGE_TEXT);
        return body ? `\n--- ${p.url.pathname} ---\n${body}` : '';
      }),
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, ScraperService.MAX_TEXT);

    if (text.replace(/\s/g, '').length < ScraperService.THIN_TEXT) {
      throw new BadRequestException(
        `${base.host} has almost no readable text — it may be a single-page app that renders in the browser. ` +
          'Try a specific page such as their About or Services URL.',
      );
    }

    const images = [...entry.images];
    for (const p of extras) {
      for (const img of p.images) if (images.length < 12 && !images.includes(img)) images.push(img);
    }
    const headings = [...entry.headings];
    for (const p of extras) {
      for (const h of p.headings) if (headings.length < 24 && !headings.includes(h)) headings.push(h);
    }
    const phone =
      entry.tel ??
      (entry.ld.telephone ? this.cleanPhone(entry.ld.telephone) : null) ??
      extras.map((p) => p.tel ?? (p.ld.telephone ? this.cleanPhone(p.ld.telephone) : null)).find(Boolean) ??
      null;

    this.log.log(
      `scraped ${base.host}: ${text.length} chars, ${extras.length} extra page(s) via ${source}, ` +
        `${images.length} image(s)`,
    );
    return {
      url: url.toString(),
      finalUrl: base.toString(),
      title: entry.title || entry.ld.name,
      description: entry.description || entry.ld.description,
      text,
      headings,
      imageUrl: entry.logo,
      images,
      phone,
      alsoRead: extras.map((p) => p.url.toString()),
      pages,
    };
  }
}
