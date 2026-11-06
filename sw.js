/* Offline cache: static app shell only. Bump CACHE when files change. */
const CACHE = 'ascent-v3';
const FILES = ['./', 'index.html', 'css/styles.css', 'icon.svg', 'manifest.webmanifest', 'js/skills.js', 'js/bank-rw1.js', 'js/bank-rw2.js', 'js/bank-rw3.js', 'js/bank-math.js', 'js/gen.js', 'js/core.js', 'js/icons.js', 'js/ui-base.js', 'js/ui-session.js', 'js/ui-views.js', 'js/ui-scores.js', 'js/ai.js', 'js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts/Desmos: network only
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
