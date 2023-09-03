const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // See https://stackoverflow.com/questions/62324139/why-is-my-react-component-rendering-twice-on-initial-load
  // With Strict Mode enabled, components initially render twice!
  reactStrictMode: true,

  // See https://nextjs.org/docs/pages/api-reference/next-config-js/output
  output: "standalone",

  // Private and public keys are not included by default
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["private.key", "public.key"],
    },
  },

  images: {
    domains: [],

    minimumCacheTTL: 31_536_000, // One year
  },
});

// In version 12.1.6, font optimization does not work for routes using SSR
// Fixed in next@12.1.7-canary.5
// https://github.com/vercel/next.js/issues/35835
