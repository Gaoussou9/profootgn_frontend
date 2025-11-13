// public/service-worker.js
const CACHE_NAME = 'kanousport-shell-v1';
const SHELL_URLS = [
  '/',                // index
  '/index.html',
  '/KanuLogo.jpg',
  '/Ballon.jpg',
  // ajoute ici les assets critiques (CSS/JS/build hashed si tu veux)
];

// install -> precache shell
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(SHELL_URLS))
  );
});

// activate -> cleanup old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// fetch -> network-first for /api/, cache-first for static
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  // API requests => network-first (fresh data), fallback cache
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/matches')) {
    evt.respondWith(
      fetch(req)
        .then((resp) => {
          // Optional: cache API GET responses if desired
          if (req.method === 'GET' && resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets & pages => cache-first fallback network
  evt.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((networkResp) => {
          // cache GET successful responses (optional)
          if (req.method === 'GET' && networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return networkResp;
        })
        .catch(() => {
          // fallback for images
          if (req.destination === 'image') return caches.match('/KanuLogo.jpg');
        });
    })
  );
});
