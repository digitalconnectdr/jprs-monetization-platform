/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@platform/shared",
    "@platform/ui",
    "@platform/db",
    "@platform/analytics",
    "@platform/monetization",
    "@platform/content",
    "@platform/seo",
  ],
};

export default nextConfig;
