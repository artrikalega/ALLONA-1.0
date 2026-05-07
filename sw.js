// Kenari Finance - Service Worker
// Versi cache — update angka ini setiap ada perubahan besar
const CACHE_NAME = 'kenari-finance-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install: cache semua asset
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache First untuk asset lokal, Network First untuk API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google Drive API & Google Fonts → langsung ke network
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('accounts.google.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
    return;
  }

  // Asset lokal → Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache response baru
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
