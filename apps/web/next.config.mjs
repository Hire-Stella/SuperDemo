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
   * The rewrite alone is not enough for `next/image`.
   *
   * The optimizer fetches the rewritten URL itself, and refuses any host that
   * is not allow-listed — so every template photograph came back 400 while the
   * page around it rendered fine. Derived from the same variable so the two
   * cannot drift apart.
   */
  images: (() => {
    const base = process.env.TEMPLATE_ASSET_BASE;
    if (!base) return {};
    const u = new URL(base);
    return {
      remotePatterns: [
        {
          protocol: u.protocol.replace(':', ''),
          hostname: u.hostname,
          ...(u.port ? { port: u.port } : {}),
          pathname: '/t/**',
        },
      ],
    };
  })(),
  // The dev indicator defaults to bottom-left, directly on top of the sidebar's
  // presence selector. Dev-only, but it hides a control agents use constantly.
  devIndicators: { position: 'bottom-right' },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
