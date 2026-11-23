/* PLAYNOVA Service Worker v2 — namespaced cache, safe fallbacks, offline games.
   Safe-fail: any cache/register error leaves the site fully functional. */
const VERSION = 'playnova-v17';
const CORE = ['./','index.html','offline.html','site.webmanifest',
 'assets/css/portal.css','assets/js/portal.js','assets/js/registry.js','assets/js/player.js',
 'assets/js/audio.js','assets/js/ads.js','assets/js/ads-config.js','assets/js/touchpad.js',
 'assets/css/playnova-ui.css','assets/js/playnova-core.js','assets/js/profile.js','assets/js/pn-bridge.js','assets/js/pn-enhance.js','assets/js/pn-frame.js','assets/js/game-capabilities.json','profile/index.html',
 'assets/img/favicon.svg','assets/img/icon-192.png','assets/img/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await Promise.allSettled(CORE.map(u => c.add(u)));
    await self.skipWaiting();
  }).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('playnova-') && k !== VERSION).map(k => caches.delete(k)))) /* শুধু PLAYNOVA-এর পুরোনো ভার্সন */
    .then(() => self.clients.claim()).catch(() => {}));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== location.origin) return; /* third-party কখনো intercept নয় */
  const isNav = req.mode === 'navigate';
  const p = url.pathname;
  const isGameish = p.endsWith('.html') || p.includes('/games-src/') || p.includes('/game/');
  if (isNav) { /* each page is cached under its own URL; offline miss -> offline.html (never another page) */
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match('offline.html')).then(m => m || caches.match('index.html'))));
    return;
  }
  if (isGameish) { /* games: network-first, cache fallback — শুধু ok রেসপন্স cache */
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req)));
    return;
  }
  /* static assets: cache-first; ব্যর্থ হলে network; CSS/JS/img-এর বদলে HTML কখনো নয় */
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => Response.error())));
});
