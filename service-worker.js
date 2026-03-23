const CACHE = 'lifeos-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Skip non-GET or chrome-extension requests
  if (e.request.method !== 'GET' || e.request.url.startsWith('chrome-extension')) return;

  // For API calls (Anthropic), go network-first, no caching
  if (e.request.url.includes('anthropic.com') || e.request.url.includes('fonts.googleapis') || e.request.url.includes('fonts.gstatic') || e.request.url.includes('unpkg.com') || e.request.url.includes('cdnjs.cloudflare')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
