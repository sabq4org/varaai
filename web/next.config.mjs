/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Logos come from many provider CDNs; we render them with a plain <img> + fallback
  // (see components/Logo.tsx), so no next/image remotePatterns config is needed.
};

export default nextConfig;
