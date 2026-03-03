const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Add turbopack config to silence the warning
  turbo: {},

  // Keep webpack config for compatibility
  webpack: (config, options) => {
    return config;
  },
};

module.exports = withPWA(nextConfig);
