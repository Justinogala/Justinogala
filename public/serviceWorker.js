
/* eslint-disable no-restricted-globals */
/* global clients */
// Copy of src/services/serviceWorker.js for direct serving from public
// This is required because vite dev server doesn't compile service worker file from src automatically
// to root without plugin. For this environment, we place it in public.

const CACHE_VERSION = 'v1';
const CACHE_NAME = `munal-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `munal-dynamic-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    return; 
  }

  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf)$/) ||
    PRECACHE_URLS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request.url, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-transcriptions') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  const title = 'Munal';
  const options = {
    body: event.data ? event.data.text() : 'New activity',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Fix: Use self.clients instead of implicit global clients
  event.waitUntil(self.clients.openWindow('/'));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
