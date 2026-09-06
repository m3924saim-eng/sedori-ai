// v14.6.0 hotfix: retire the old PWA cache/service worker.
// Safari can keep an old cached app shell for a long time, so this worker
// deliberately unregisters itself and removes every sedori-ai cache.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('sedori-ai-')).map(k => caches.delete(k)));
    } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

// Network only while this retiring worker is still controlling an old tab.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
