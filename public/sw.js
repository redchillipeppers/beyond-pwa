self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('beyond-cache-v1').then((cache) => cache.addAll(['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png']))
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});