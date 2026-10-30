// Service worker: app shell offline, network-first for pages so updates arrive quickly.
// When Firebase + a VAPID key are configured it also receives the shift-reminder pushes.
importScripts('config.js');
const CFG = self.NV_CONFIG || {};
if (CFG.firebase && CFG.vapidKey) {
  importScripts(CFG.sdkBase + 'firebase-app-compat.js', CFG.sdkBase + 'firebase-messaging-compat.js');
  firebase.initializeApp(CFG.firebase);
  firebase.messaging(); // shows `notification` payloads while the app is closed
}

const CACHE = 'neshek-vase-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './store.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/school-logo.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache-first
  if (url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Same-origin: network-first, fall back to cache
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
