// FlussoLab service worker: keeps the app available offline.
// Change VERSION whenever you publish new files, so users get the update.
const VERSION = 'flussolab-0.2.1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/core.js', 'js/app.js', 'js/pwa.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)));
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
  // App files: answer from the cache, so it opens instantly and offline.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit ||
    fetch(req).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error())));
});
