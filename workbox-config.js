module.exports = {
  globDirectory: "dist",
  maximumFileSizeToCacheInBytes: 5000000,
  globPatterns: [
    "**/*.{html,js,css,png,svg,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}"
  ],
  swSrc: "client/service-worker.js",
  swDest: "dist/service-worker.js"
};