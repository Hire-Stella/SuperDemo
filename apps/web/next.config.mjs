/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @superdemo/contracts ships as compiled CommonJS from the workspace; Next needs
  // to transpile it rather than treat it as an external package.
  transpilePackages: [
    '@superdemo/contracts',
    '@stella/template-sanvera',
    '@stella/template-momentum',
    '@stella/template-reodental',
    '@stella/template-tripvanta',
    '@stella/template-elianvalen',
    '@stella/template-rescale',
    '@stella/template-stackgrid',
    '@stella/template-utomic',
    '@stella/template-zova',
    '@stella/template-runtime',
    '@stella/template-schema',
  ],

  /*
   * Where the ported templates' own imagery is served from.
   *
   * Those files are ~78MB across nine templates — the stock photography each
   * was cloned with. They are deliberately not vendored into this repo: that
   * is a 78MB git object and a 78MB Vercel build, for images a tenant's own
   * scrape mostly replaces anyway.
   *
   * So the paths stay `/t/<template>/…` and the host decides where that
   * resolves. Unset, it is same-origin and those images 404 — the page still
   * renders, with the bands that use them looking plain. Set, it proxies.
   * In development the gallery at :3400 already serves them.
   */
  async rewrites() {
    const base = process.env.TEMPLATE_ASSET_BASE;
    return base ? [{ source: '/t/:path*', destination: `${base}/t/:path*` }] : [];
  },

  /*
   * Which hosts `next/image` may fetch from.
   *
   * Two different needs, and missing either one 500s a public page.
   *
   * A tenant's own imagery comes from whatever domain their site used — that
   * is the whole point of scraping it — so there is no list to enumerate.
   * `https://**` is the honest policy for a page whose images are, by design,
   * somebody else's. The in-house templates never hit this because they use
   * plain `<img>`; the ported ones use `next/image`, which is why it surfaced
   * only after they landed.
   *
   * The asset base is separate and may be plain http in development, so it is
   * derived from the same variable as the rewrite rather than restated.
   */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      ...(() => {
        const base = process.env.TEMPLATE_ASSET_BASE;
        if (!base) return [];
        const u = new URL(base);
        return [
          {
            protocol: u.protocol.replace(':', ''),
            hostname: u.hostname,
            ...(u.port ? { port: u.port } : {}),
            pathname: '/t/**',
          },
        ];
      })(),
    ],
  },
  // The dev indicator defaults to bottom-left, directly on top of the sidebar's
  // presence selector. Dev-only, but it hides a control agents use constantly.
  devIndicators: { position: 'bottom-right' },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
