
/* eslint-disable no-restricted-globals */
/* global clients */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

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

// Install Event - Precache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Calls: Network First, Fallback to Cache (if applicable)
  // For this demo, we might not cache API calls aggressively to avoid stale data, 
  // but we can add logic here if needed.
  if (url.pathname.startsWith('/api/')) {
    // Network Only for API for now to ensure data freshness
    // Or implement Network First if you want offline read support
    return; 
  }

  // 2. Static Assets (JS, CSS, Images, Fonts): Cache First
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

  // 3. Navigation Requests (HTML): Network First, Fallback to Cache, Fallback to Offline Page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              // If both network and cache fail, show offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  if (event.tag === 'sync-new-transcriptions') {
    console.log('[Service Worker] Syncing new transcriptions');
    event.waitUntil(
      // Logic to sync data from IndexedDB to Server would go here
      Promise.resolve() 
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Munal';
  const options = {
    body: event.data.text() || 'New activity in your workspace',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  // Fix: Use self.clients instead of implicit global clients
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
