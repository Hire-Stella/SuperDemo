import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * No network: DNS is stubbed so any host containing "internal" resolves to a
 * private address and everything else to a public one; fetch is a route table.
 */
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    if (host.includes('internal')) return [{ address: '10.0.0.5', family: 4 }];
    if (host.includes('nxdomain')) throw new Error('ENOTFOUND');
    return [{ address: '93.184.216.34', family: 4 }];
  }),
}));

import { ScraperService } from './scraper.service';

type Route = { status?: number; body?: string; type?: string; location?: string };
let routes: Record<string, Route>;
let requested: { url: string; ua: string }[];

const html = (title: string, body: string, head = '') =>
  `<!doctype html><html><head><title>${title}</title>${head}</head><body>${body}</body></html>`;

const para = (s: string, n = 6) =>
  Array.from({ length: n }, (_, i) => `<p>${s} sentence number ${i} with enough words to count.</p>`).join('');

beforeEach(() => {
  routes = {};
  requested = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string, init: { headers: Record<string, string> }) => {
      const url = String(input);
      requested.push({ url, ua: init.headers['user-agent'] ?? '' });
      const r = routes[url];
      if (!r) return new Response('not found', { status: 404, headers: { 'content-type': 'text/html' } });
      const headers: Record<string, string> = { 'content-type': r.type ?? 'text/html; charset=utf-8' };
      if (r.location) headers.location = r.location;
      return new Response(r.status && r.status >= 300 && r.status < 400 ? null : (r.body ?? ''), {
        status: r.status ?? 200,
        headers,
      });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const xml = (body: string): Route => ({ body, type: 'application/xml; charset=UTF-8' });
const urlset = (urls: string[]) =>
  `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((u) => `<url><loc>${u}</loc><image:image><image:loc>${u}hero.jpg</image:loc></image:image></url>`)
    .join('')}</urlset>`;

describe('ScraperService', () => {
  it('follows a 301 to a sitemap index and reads the page sitemap first', async () => {
    const S = 'https://www.tecpro.test';
    routes[`${S}/`] = { body: html('TecPro', para('Home of managed IT')) };
    routes[`${S}/sitemap.xml`] = { status: 301, location: `${S}/sitemap_index.xml` };
    routes[`${S}/sitemap_index.xml`] = xml(
      `<?xml version="1.0"?><sitemapindex><sitemap><loc>${S}/post-sitemap.xml</loc></sitemap>` +
        `<sitemap><loc>${S}/page-sitemap.xml</loc></sitemap></sitemapindex>`,
    );
    routes[`${S}/page-sitemap.xml`] = xml(urlset([`${S}/`, `${S}/cyber-security/`, `${S}/contact-us/`]));
    routes[`${S}/post-sitemap.xml`] = xml(urlset([`${S}/2024/05/some-news/`]));
    routes[`${S}/cyber-security/`] = { body: html('Cyber', para('We protect networks')) };
    routes[`${S}/contact-us/`] = {
      body: html('Contact', para('Call our office') + '<a href="tel:+1 (555) 123-4567">Call</a>'),
    };
    routes[`${S}/2024/05/some-news/`] = { body: html('News', para('A news post')) };

    const site = await new ScraperService().scrape(`${S}/`);
    const sitemapOrder = requested.map((r) => r.url).filter((u) => u.includes('sitemap'));
    expect(sitemapOrder.indexOf(`${S}/page-sitemap.xml`)).toBeLessThan(
      sitemapOrder.indexOf(`${S}/post-sitemap.xml`),
    );
    expect(site.alsoRead).toEqual(
      expect.arrayContaining([`${S}/cyber-security/`, `${S}/contact-us/`, `${S}/2024/05/some-news/`]),
    );
    // Contact before cyber-security before the dated post.
    expect(site.alsoRead[0]).toBe(`${S}/contact-us/`);
    expect(site.alsoRead.at(-1)).toBe(`${S}/2024/05/some-news/`);
    expect(site.pages[0]!.url).toBe(`${S}/`);
    expect(site.pages).toHaveLength(4);
    expect(site.phone).toBe('+15551234567');
    // image:loc entries are images, not pages.
    expect(requested.some((r) => r.url.endsWith('hero.jpg'))).toBe(false);
  });

  it('ranks services and contact pages above blog and career pages', () => {
    const svc = new ScraperService() as unknown as {
      rank(raw: string[], base: URL, robots: { sitemaps: string[]; rules: unknown[] }): URL[];
    };
    const base = new URL('https://acme.test/');
    const ranked = svc
      .rank(
        [
          'https://acme.test/blog/hello-world/',
          'https://acme.test/careers/',
          'https://acme.test/services/',
          'https://www.acme.test/contact/#form',
          'https://acme.test/privacy-policy/',
          'https://acme.test/brochure.pdf',
          'https://other.test/services/',
          'https://acme.test/services/?utm_source=x',
          'https://acme.test/cart/',
        ],
        base,
        { sitemaps: [], rules: [] },
      )
      .map((u) => u.pathname);
    expect(ranked.slice(0, 2).sort()).toEqual(['/contact/', '/services/']);
    expect(ranked).toContain('/blog/hello-world/');
    expect(ranked.indexOf('/careers/')).toBeGreaterThan(ranked.indexOf('/services/'));
    expect(ranked).not.toContain('/brochure.pdf');
    expect(ranked).not.toContain('/cart/');
    expect(ranked.filter((p) => p === '/services/')).toHaveLength(1);
  });

  it('drops lines repeated on three or more pages', async () => {
    const S = 'https://repeat.test';
    const footer = '<div>Subscribe to our newsletter today</div>';
    routes[`${S}/`] = { body: html('Home', para('Welcome home') + footer) };
    routes[`${S}/sitemap.xml`] = xml(urlset([`${S}/about/`, `${S}/services/`]));
    routes[`${S}/about/`] = { body: html('About', para('About the founders') + footer) };
    routes[`${S}/services/`] = { body: html('Services', para('Plumbing and heating') + footer) };

    const site = await new ScraperService().scrape(`${S}/`);
    expect(site.alsoRead).toHaveLength(2);
    expect(site.text).not.toContain('Subscribe to our newsletter');
    expect(site.text).toContain('Plumbing and heating');
    for (const p of site.pages) expect(p.text).not.toContain('Subscribe');
  });

  it('respects robots.txt Disallow for pages it chose itself', async () => {
    const S = 'https://robots.test';
    routes[`${S}/`] = { body: html('Home', para('Welcome')) };
    routes[`${S}/robots.txt`] = {
      type: 'text/plain',
      body: `User-agent: *\nDisallow: /private/\nAllow: /private/ok\n\nSitemap: ${S}/sm.xml\n`,
    };
    routes[`${S}/sm.xml`] = xml(urlset([`${S}/private/secret/`, `${S}/private/ok/`, `${S}/about/`]));
    routes[`${S}/about/`] = { body: html('About', para('About us')) };
    routes[`${S}/private/ok/`] = { body: html('Ok', para('Allowed after all')) };
    routes[`${S}/private/secret/`] = { body: html('Secret', para('Should not be read')) };

    const site = await new ScraperService().scrape(`${S}/`);
    expect(requested.some((r) => r.url === `${S}/private/secret/`)).toBe(false);
    expect(site.alsoRead).toEqual(expect.arrayContaining([`${S}/about/`, `${S}/private/ok/`]));
  });

  it('never fetches a sitemap URL that resolves to a private address', async () => {
    const S = 'https://ssrf.test';
    routes[`${S}/`] = { body: html('Home', para('Welcome')) };
    routes[`${S}/sitemap.xml`] = xml(
      `<sitemapindex><sitemap><loc>http://169.254.169.254/latest/meta-data/</loc></sitemap>` +
        `<sitemap><loc>https://metadata.internal/page-sitemap.xml</loc></sitemap>` +
        `<sitemap><loc>${S}/page-sitemap.xml</loc></sitemap></sitemapindex>`,
    );
    routes[`${S}/page-sitemap.xml`] = xml(urlset([`${S}/about/`]));
    routes[`${S}/about/`] = { status: 302, location: 'http://127.0.0.1:55432/' };

    const site = await new ScraperService().scrape(`${S}/`);
    const hit = requested.map((r) => r.url);
    expect(hit.some((u) => u.includes('169.254') || u.includes('internal') || u.includes('127.0.0.1'))).toBe(
      false,
    );
    expect(hit).toContain(`${S}/page-sitemap.xml`);
    expect(site.alsoRead).toEqual([]);
  });

  it('succeeds on a JS-rendered entry page that ships JSON-LD', async () => {
    const S = 'https://spa.test';
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Bright Smile Dental',
      description: 'Family dentistry with evening and weekend appointments for the whole family.',
      telephone: '+44 20 7946 0958',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '12 High Street',
        addressLocality: 'London',
        postalCode: 'N1 1AA',
      },
      openingHours: ['Mo-Fr 08:00-20:00', 'Sa 09:00-14:00'],
    };
    routes[`${S}/`] = {
      body: html(
        'Bright Smile',
        '<div id="root"></div>',
        `<meta name="description" content="Dentist in Islington &amp; Highbury">` +
          `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
      ),
    };
    const site = await new ScraperService().scrape(`${S}/`);
    expect(site.text).toContain('Bright Smile Dental');
    expect(site.text).toContain('12 High Street, London, N1 1AA');
    expect(site.text).toContain('Mo-Fr 08:00-20:00');
    expect(site.description).toBe('Dentist in Islington & Highbury');
    expect(site.phone).toBe('+442079460958');
  });

  it('falls back to the bare host when www fails', async () => {
    routes['https://bare.test/'] = { body: html('Bare', para('The real site lives here')) };
    const site = await new ScraperService().scrape('https://www.bare.test/');
    expect(site.finalUrl).toBe('https://bare.test/');
    expect(site.url).toBe('https://www.bare.test/');
    expect(site.text).toContain('The real site lives here');
  });

  it('retries the entry page once as a browser after a WAF 403', async () => {
    const S = 'https://waf.test';
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL, init: { headers: Record<string, string> }) => {
        if (String(input) !== `${S}/`) return new Response('', { status: 404 });
        calls++;
        return init.headers['user-agent']!.includes('HireStellaBot')
          ? new Response('blocked', { status: 403, headers: { 'content-type': 'text/html' } })
          : new Response(html('Waf', para('Behind a firewall')), { headers: { 'content-type': 'text/html' } });
      }),
    );
    const site = await new ScraperService().scrape(`${S}/`);
    expect(calls).toBe(2);
    expect(site.text).toContain('Behind a firewall');
  });

  it('still refuses a private entry URL, without trying variants', async () => {
    await expect(new ScraperService().scrape('http://127.0.0.1/')).rejects.toThrow(/not a public address/);
    expect(requested).toEqual([]);
  });

  it('strips nav, footer and cookie banners but falls back when that leaves nothing', async () => {
    const svc = new ScraperService() as unknown as { readPage(h: string, u: URL): { lines: string[] } };
    const strict = svc.readPage(
      html(
        'x',
        `<nav><a href="/a">Menu item</a></nav><main>${para('Real content')}</main>` +
          `<div class="cookie-notice">We use cookies</div><footer>Footer text</footer>`,
      ),
      new URL('https://x.test/'),
    );
    expect(strict.lines.join('\n')).toContain('Real content');
    expect(strict.lines.join('\n')).not.toMatch(/Menu item|We use cookies|Footer text/);

    const headerOnly = svc.readPage(
      html('x', `<header>${para('Everything is in the header on this site')}</header>`),
      new URL('https://x.test/'),
    );
    expect(headerOnly.lines.join('\n')).toContain('Everything is in the header');
  });
});
