/* Admin PWA service worker — scope /admin/
 *
 * Strategy:
 *  - Navigations and /api/admin/* → network first, fall back to cache so the
 *    dashboard still opens (with the last-loaded data) when offline.
 *  - Built assets (/_astro/*) → cache first (they're content-hashed).
 *  - Mutations (POST/PATCH/DELETE) → never cached.
 */
const VERSION = 'pj-admin-v1';
const RUNTIME = `${VERSION}-runtime`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('pj-admin-') && k !== RUNTIME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache auth entry/exit or the CSV export.
  if (url.pathname.startsWith('/admin/enter/') || url.pathname.startsWith('/admin/logout') || url.pathname.endsWith('.csv')) return;

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate' || url.pathname.startsWith('/api/admin/') || url.pathname.startsWith('/admin/')) {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(request);
    // Don't cache 401s — a logged-out state must not stick around offline.
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === 'navigate') {
      return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><p style="font-family:system-ui;padding:2rem">You are offline and this page has not been cached yet.</p>', {
        headers: { 'content-type': 'text/html' },
      });
    }
    return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
}
