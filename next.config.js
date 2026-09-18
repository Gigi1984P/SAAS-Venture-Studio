/** @type {import('next').NextConfig} */
const withNextIntl = require("next-intl/plugin")("./i18n/request.ts");

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Playwright und andere Server-only Module als External markieren
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    } else {
      // Markiere Playwright als External (wird nur Server-seitig verwendet)
      config.externals = [...(config.externals || []), "playwright-core", "chromium"];
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
