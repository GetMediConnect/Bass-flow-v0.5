/**
 * BassFlow v6 — Service Worker
 * Strategy:
 *   - App shell  → Cache-first (always available offline)
 *   - API calls  → Network-first, fallback JSON 503
 *   - Media/CDN  → Stale-while-revalidate
 *   - Everything else → Network-first, cache on success
 */

const CACHE_SHELL   = 'bf-shell-v6.2';
const CACHE_DYNAMIC = 'bf-dynamic-v6.2';
const CACHE_MEDIA   = 'bf-media-v6.2';

const SHELL_URLS = [
  '/',
  '/bassflow_v6.html',
  '/manifest.json',
];

const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
];

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then((c) => c.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ───────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  const CURRENT = new Set([CACHE_SHELL, CACHE_DYNAMIC, CACHE_MEDIA]);
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !CURRENT.has(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // 1. API calls → network-first, offline JSON stub
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(request, CACHE_DYNAMIC, offlineApi()));
    return;
  }

  // 2. Uploaded media → cache-first
  if (url.pathname.startsWith('/uploads/')) {
    e.respondWith(cacheFirst(request, CACHE_MEDIA));
    return;
  }

  // 3. CDN fonts/icons → stale-while-revalidate
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(request, CACHE_MEDIA));
    return;
  }

  // 4. App shell → cache-first
  if (SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
    e.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // 5. Everything else → network-first
  e.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'BassFlow 🎵', {
      body:    data.body || 'New activity on BassFlow',
      icon:    '/manifest.json',
      badge:   '/manifest.json',
      tag:     data.tag || 'bassflow',
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',    title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss'  },
      ],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const existing = cs.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'bf-sync-plays') {
    e.waitUntil(flushPlayQueue());
  }
});

async function flushPlayQueue() {
  // Placeholder: flush any queued play-count increments stored in IndexedDB
}

// ── Strategies ────────────────────────────────────────────────────────────────
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    const c = await caches.open(cacheName);
    c.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req, cacheName, fallback) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const c = await caches.open(cacheName);
      c.put(req, res.clone());
    }
    return res;
  } catch (_) {
    const cached = await caches.match(req);
    return cached || fallback || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}

function offlineApi() {
  return new Response(
    JSON.stringify({ error: 'Offline — no network connection', offline: true }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}
