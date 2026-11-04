// KliPro Studios Service Worker for PWA Offline Caching
const CACHE_NAME = 'klipro-cache-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// Install: precache critical app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_PRECACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for assets, network-first for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for POST requests or non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API calls: Network first, don't break realtime AI or UPI endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cross-origin audio/video streams or QR code server: let browser handle natively
  if (
    url.hostname.includes('qrserver.com') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm')
  ) {
    return;
  }

  // Stale-while-revalidate for static assets, html, css, js, fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
