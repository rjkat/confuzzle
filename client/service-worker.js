importScripts('workbox-v6.0.2/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: 'workbox-v6.0.2'
});

const {precacheAndRoute, cleanupOutdatedCaches} = workbox.precaching;
const {pageCache, imageCache, staticResourceCache} = workbox.recipes;
const {setCacheNameDetails, clientsClaim} = workbox.core;

setCacheNameDetails({
  prefix: 'confuzzle',
  suffix: 'v3'
});

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST, {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});

pageCache();

staticResourceCache();

imageCache();