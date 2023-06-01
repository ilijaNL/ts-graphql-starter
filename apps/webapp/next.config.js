const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const bucketDomain = new URL(process.env.NEXT_APP_CDN).hostname;

module.exports = withBundleAnalyzer({
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
