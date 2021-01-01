importScripts('workbox-v6.0.2/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: 'workbox-v6.0.2'
});

const {precacheAndRoute} = workbox.precaching;
const {pageCache, imageCache, staticResourceCache} = workbox.recipes;

precacheAndRoute(self.__WB_MANIFEST);

pageCache();

staticResourceCache();

imageCache();