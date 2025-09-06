/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, "encoding"];
    return config;
  },
};

module.exports = nextConfig;
