
// service-worker.js
const CACHE_NAME = 'hpr-elo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './service-worker.js',
  './favicon-32.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon-180.png'
];

// Installer service worker og cach appens grundfiler
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

// Aktivér og ryd gamle caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategi
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network first for players.json (friske data)
  if (url.pathname.endsWith('/players.json')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for alle andre filer
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request)
          .then((res) => {
            if (e.request.method === 'GET' && url.origin === self.location.origin) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, res.clone()));
            }
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
