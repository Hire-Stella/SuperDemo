/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @superdemo/contracts ships as compiled CommonJS from the workspace; Next needs
  // to transpile it rather than treat it as an external package.
  transpilePackages: ['@superdemo/contracts'],
  // The dev indicator defaults to bottom-left, directly on top of the sidebar's
  // presence selector. Dev-only, but it hides a control agents use constantly.
  devIndicators: { position: 'bottom-right' },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
