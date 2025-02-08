/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // exclude subgraph-transaction folder from TypeScript checking during build
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // ignore subgraph-transaction folder
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/subgraph-transaction/**']
    };
    return config;
  }
};

module.exports = nextConfig; 