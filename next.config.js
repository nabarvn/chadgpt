/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["links.papareact.com"],
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
