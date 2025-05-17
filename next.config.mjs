/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push("formidable");
    }
    return config;
  },
};

module.exports = nextConfig;
