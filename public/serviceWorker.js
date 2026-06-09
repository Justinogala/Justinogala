
/* eslint-disable no-restricted-globals */
/* global clients */
// Munal AI Service Worker - Offline Support

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `munal-static-${CACHE_VERSION}`;
const API_CACHE = `munal-api-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `munal-dynamic-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// API routes to cache for offline access (GET only)
const CACHEABLE_API_ROUTES = [
  '/api/documents',
  '/api/presentations',
  '/api/sheets',
  '/api/calendar/events',
  '/api/users',
];

// ============== Install ==============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ============== Activate ==============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ============== Fetch ==============
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests — Network first, fallback to cache
  if (url.pathname.startsWith('/api/') && event.request.method === 'GET') {
    const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route));
    if (isCacheable) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response.ok) {
              const cloned = response.clone();
              caches.open(API_CACHE).then(cache => cache.put(event.request, cloned));
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then(cached => {
              if (cached) return cached;
              return new Response(JSON.stringify({ offline: true, data: [] }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
          })
      );
      return;
    }
    return;
  }

  // Non-GET API requests — pass through (sync queue handles offline)
  if (url.pathname.startsWith('/api/')) return;

  // Static assets — Cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico|webp)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, cloned));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Navigation — Network first, fallback to cached index
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put('/', cloned));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }
});

// ============== Background Sync ==============
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_REQUESTED' }));
      })
    );
  }
});

// ============== Push Notifications ==============
self.addEventListener('push', (event) => {
  let title = 'Munal AI';
  let options = {
    body: 'New activity',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.body || options.body;
      options.icon = payload.icon || options.icon;
      options.data = { url: payload.url || '/' };
      options.vibrate = [100, 50, 100];
      options.requireInteraction = true;
      options.actions = [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    } catch {
      options.body = event.data.text() || options.body;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  if (event.action === 'dismiss') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
