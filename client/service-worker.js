importScripts('workbox-v6.0.2/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: 'workbox-v6.0.2'
});

const {precacheAndRoute} = workbox.precaching;
const {registerRoute} = workbox.routing;
const {CacheFirst} = workbox.strategies;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  function () { return true; },
  new CacheFirst()
);
