// FlussoLab service worker: keeps the app available offline.
// Change VERSION whenever you publish new files, so users get the update.
const VERSION = 'flussolab-1.0.0';
const FILES = ['./', 'index.html', 'en/', 'en/index.html', 'css/home.css', 'app/', 'app/index.html', 'css/style.css', 'js/core.js', 'js/app.js', 'js/pwa.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png', 'lang/languages.json', 'lang/it.json', 'lang/en.json', 'fonts/atkinson-400.woff2', 'fonts/atkinson-400i.woff2', 'fonts/atkinson-700.woff2', 'fonts/gabarito-600.woff2', 'fonts/gabarito-800.woff2', 'fonts/jetbrains-mono-400.woff2', 'fonts/jetbrains-mono-600.woff2'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so the new version gets the new files.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Fonts: keep a copy so the app looks the same offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); c.put(req, res.clone()); return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Language files: answer from the cache, then refresh it, so a new or corrected language arrives by itself.
  if (url.pathname.includes('/lang/')) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  // App files: answer from the cache, so it opens instantly and offline.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit ||
    fetch(req).catch(() => req.mode !== 'navigate' ? Response.error() : caches.match(url.pathname.includes('/app') ? 'app/index.html' : 'index.html'))));
});
