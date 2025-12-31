/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fabrknt/ui', '@fabrknt/auth', '@fabrknt/db', '@fabrknt/api', '@fabrknt/blockchain'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
