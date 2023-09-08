const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const bucketDomain = new URL(process.env.NEXT_APP_CDN).hostname;

module.exports = withBundleAnalyzer({
  pageExtensions: ['r.tsx', 'r.ts', /* 'page.jsx', 'page.js' */],
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  reactStrictMode: true,
  images: {
    domains: [bucketDomain],
  },
  swcMinify: true,
})
