importScripts('workbox/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: 'workbox'
});

const {precacheAndRoute, cleanupOutdatedCaches} = workbox.precaching;
const {pageCache, imageCache, staticResourceCache} = workbox.recipes;
const {setCacheNameDetails, clientsClaim, skipWaiting} = workbox.core;

setCacheNameDetails({
  prefix: 'confuzzle',
  suffix: 'v4'
});

skipWaiting();
clientsClaim();

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST, {
  // Ignore all URL parameters.
  ignoreURLParametersMatching: [/.*/]
});

pageCache();

staticResourceCache();

imageCache();