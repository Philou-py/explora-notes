module.exports = {
  // See https://stackoverflow.com/questions/62324139/why-is-my-react-component-rendering-twice-on-initial-load
  // With Strict Mode enabled, components initially render twice!
  reactStrictMode: true,

  images: {
    domains: [
      "file-server.toccatech.com",
      "toccatech.com",
      "explora-notes.com",
      "upload.wikimedia.org",
      "firebasestorage.googleapis.com",
      "images.unsplash.com",
    ],

    minimumCacheTTL: 31_536_000, // One year
  },
};

// In version 12.1.6, font optimization does not work for routes using SSR
// Fixed in next@12.1.7-canary.5
// https://github.com/vercel/next.js/issues/35835
