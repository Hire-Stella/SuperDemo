import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
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
 * A residual gap worth naming: between the DNS check and the connection, the
 * record could change (DNS rebinding). Closing it needs the socket pinned to
 * the vetted address, which Node's fetch does not expose. The window is
 * seconds, the attacker must control authoritative DNS, and the payoff is one
 * unauthenticated GET whose body is then handed to an LLM rather than returned.
 * Recorded here rather than left to be discovered.
 */
@Injectable()
export class ScraperService {
  private readonly log = new Logger(ScraperService.name);

  private static readonly MAX_BYTES = 2_000_000;
  private static readonly TIMEOUT_MS = 12_000;
  private static readonly MAX_REDIRECTS = 4;
  /** Enough for an LLM to characterise a business; far short of a token bill. */
  private static readonly MAX_TEXT = 18_000;

  /**
   * Paths worth reading beyond the entry point.
   *
   * A homepage is often a hero image and three words. What a voice agent needs
   * — services, prices, opening hours — is one click away, and these are where
   * it usually is. Tried in order, failures ignored: a site without /about is
   * not an error.
   */
  private static readonly EXTRA_PATHS = ['/about', '/about-us', '/services', '/courses', '/contact'];

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
        throw new BadRequestException(`${host} is not a public address`);
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
        throw new BadRequestException(
          `${host} resolves to ${address}, which is a private address — I only read public sites`,
        );
      }
    }
  }

  /**
   * Fetch one URL, following redirects by hand so each hop is vetted.
   *
   * Returns the body and the URL it ended up at.
   */
  private async fetchVetted(start: URL): Promise<{ html: string; finalUrl: URL }> {
    let url = start;
    for (let hop = 0; hop <= ScraperService.MAX_REDIRECTS; hop++) {
      await this.assertPublicHost(url);
      const res = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(ScraperService.TIMEOUT_MS),
        headers: {
          // Honest about who is asking. A site that would rather not be read
          // can then say so in robots.txt or block us by name.
          'user-agent': 'HireStellaBot/1.0 (+contact centre onboarding)',
          accept: 'text/html,application/xhtml+xml',
        },
      }).catch((e: unknown) => {
        throw new BadRequestException(
          `Could not read ${url.host} — ${e instanceof Error ? e.message : 'request failed'}`,
        );
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) throw new BadRequestException(`${url.host} redirected to nowhere`);
        url = new URL(location, url);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new BadRequestException('That site redirects somewhere I will not follow');
        }
        continue;
      }
      if (!res.ok) {
        throw new BadRequestException(`${url.host} answered ${res.status}`);
      }
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('html') && !type.includes('text')) {
        throw new BadRequestException(`${url.host} served ${type || 'no content type'}, not a web page`);
      }

      // Read with a hard ceiling rather than res.text(): a body advertised as
      // HTML can still be a gigabyte, and this runs on a shared worker.
      const html = await this.readCapped(res);
      return { html, finalUrl: url };
    }
    throw new BadRequestException('That site redirects too many times');
  }

  private async readCapped(res: Response): Promise<string> {
    const reader = res.body?.getReader();
    if (!reader) return '';
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
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
  }

  /* ------------------------------ extraction ----------------------------- */

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

  private meta(html: string, names: string[]): string {
    for (const name of names) {
      const re = new RegExp(
        `<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
        'i',
      );
      const m = re.exec(html);
      if (m?.[1]) return this.decode(m[1]).trim();
      const re2 = new RegExp(
        `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["']`,
        'i',
      );
      const m2 = re2.exec(html);
      if (m2?.[1]) return this.decode(m2[1]).trim();
    }
    return '';
  }

  /**
   * Visible text.
   *
   * Regex rather than a DOM parser, and that is a real trade-off: it will keep
   * the odd stray attribute and lose text inside exotic markup. It is chosen
   * because the consumer is an LLM being asked "what does this business do",
   * which tolerates noise, and because adding a parser dependency to read a
   * marketing homepage is not a trade worth making. Scripts, styles, SVG and
   * comments are removed first — those are the parts that would otherwise
   * dominate the token count.
   */
  private visibleText(html: string): string {
    return this.decode(
      html
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, ' '),
    )
      .replace(/[ \t ]+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, ScraperService.MAX_TEXT);
  }

  private headings(html: string): string[] {
    const out: string[] = [];
    for (const m of html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
      const t = this.decode((m[2] ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (t && t.length < 140 && !out.includes(t)) out.push(t);
      if (out.length >= 24) break;
    }
    return out;
  }

  /**
   * A phone number, if the page offers one.
   *
   * `tel:` links first — a number someone deliberately made dialable is far
   * more likely to be the business's own than the first digit run in the text,
   * which is regularly a price, a licence number or a year.
   */
  private phone(html: string): string | null {
    const tel = /href\s*=\s*["']tel:([^"']+)["']/i.exec(html);
    if (tel?.[1]) {
      const cleaned = tel[1].replace(/[^\d+]/g, '');
      if (cleaned.replace(/\D/g, '').length >= 7) return cleaned;
    }
    return null;
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
   * full-width band actually wants.
   */
  private galleryImages(html: string, base: URL): string[] {
    const out: string[] = [];
    const junk = /sprite|icon|favicon|logo|badge|avatar|pixel|tracking|1x1|placeholder|\.svg(\?|$)/i;

    for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
      const tag = m[1] ?? '';
      // Largest srcset candidate, else src.
      const srcset = /srcset\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
      let candidate = /(?:^|\s)src\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? '';
      if (srcset) {
        const best = this.decode(srcset)
          .split(',')
          .map((part) => part.trim().split(/\s+/))
          .map(([url, w]) => ({ url: url ?? '', w: Number((w ?? '').replace(/\D/g, '')) || 0 }))
          .sort((a, b) => b.w - a.w)[0];
        if (best?.url) candidate = best.url;
      }
      /*
       * Decode before use.
       *
       * An attribute in HTML carries `&amp;`, so a src of
       * `?width=1376&amp;height=768` reaches the CDN with the entity intact and
       * comes back 400. That broke every image on every template at once, and
       * it looked like a design problem rather than a parsing one — the pages
       * simply had no photographs.
       */
      candidate = this.decode(candidate).trim();
      if (!candidate || candidate.startsWith('data:')) continue;
      if (junk.test(candidate)) continue;

      // Prefer things the markup says are big. Where it says nothing, keep it —
      // a photograph without a width attribute is still usually a photograph.
      const w = Number(/\bwidth\s*=\s*["']?(\d{2,5})/i.exec(tag)?.[1] ?? 0);
      const h = Number(/\bheight\s*=\s*["']?(\d{2,5})/i.exec(tag)?.[1] ?? 0);
      if ((w && w < 400) || (h && h < 220)) continue;

      try {
        const u = new URL(candidate, base);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
        const clean = u.toString();
        if (!out.includes(clean)) out.push(clean);
      } catch {
        /* unparseable src, skip */
      }
      if (out.length >= 12) break;
    }
    return out;
  }

  private image(html: string, base: URL): string | null {
    const candidate =
      this.meta(html, ['og:image', 'twitter:image']) ||
      /<link[^>]+rel\s*=\s*["'](?:apple-touch-icon|icon)["'][^>]*href\s*=\s*["']([^"']+)["']/i.exec(
        html,
      )?.[1] ||
      '';
    if (!candidate) return null;
    try {
      const u = new URL(this.decode(candidate).trim(), base);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
    } catch {
      return null;
    }
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
   * generate from, and the operator should be told. The extra pages are
   * best-effort: each one that loads adds detail, each one that does not is
   * silently skipped.
   */
  async scrape(rawUrl: string): Promise<ScrapedSite> {
    const url = this.parseUrl(rawUrl);
    const { html, finalUrl } = await this.fetchVetted(url);

    const title = this.decode(
      /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '',
    ).replace(/\s+/g, ' ').trim();

    const parts = [this.visibleText(html)];
    const alsoRead: string[] = [];
    const images = this.galleryImages(html, finalUrl);

    for (const path of ScraperService.EXTRA_PATHS) {
      if (parts.join('\n').length > ScraperService.MAX_TEXT) break;
      try {
        const extra = new URL(path, finalUrl);
        if (extra.toString() === finalUrl.toString()) continue;
        const got = await this.fetchVetted(extra);
        const text = this.visibleText(got.html);
        // A site that serves its homepage for every unknown path would
        // otherwise have that homepage counted five times.
        if (text.length > 200 && !parts.some((p) => p.slice(0, 400) === text.slice(0, 400))) {
          parts.push(`\n\n--- ${path} ---\n${text}`);
          alsoRead.push(got.finalUrl.toString());
          for (const img of this.galleryImages(got.html, got.finalUrl)) {
            if (images.length < 12 && !images.includes(img)) images.push(img);
          }
        }
      } catch {
        /* best effort: a missing /about is not a failure */
      }
    }

    const text = parts.join('\n').slice(0, ScraperService.MAX_TEXT);
    if (text.replace(/\s/g, '').length < 200) {
      throw new BadRequestException(
        `${finalUrl.host} has almost no readable text — it may be a single-page app that renders in the browser. ` +
          'Try a specific page such as their About or Services URL.',
      );
    }

    this.log.log(
      `scraped ${finalUrl.host}: ${text.length} chars, ${alsoRead.length} extra page(s), ` +
        `${images.length} image(s)`,
    );
    return {
      url: url.toString(),
      finalUrl: finalUrl.toString(),
      title,
      description: this.meta(html, ['description', 'og:description']),
      text,
      headings: this.headings(html),
      imageUrl: this.image(html, finalUrl),
      images,
      phone: this.phone(html),
      alsoRead,
    };
  }
}
