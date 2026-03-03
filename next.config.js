const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Empty turbopack config to silence the warning
  // next-pwa uses webpack internally, but we can still use turbopack for the app
  turbopack: {},
};

module.exports = withPWA(nextConfig);
