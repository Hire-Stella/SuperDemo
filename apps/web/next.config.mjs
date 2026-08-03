/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @fit-ai/contracts ships as compiled CommonJS from the workspace; Next needs
  // to transpile it rather than treat it as an external package.
  transpilePackages: ['@fit-ai/contracts'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
