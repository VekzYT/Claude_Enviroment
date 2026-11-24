// Claude City offline cache. Everything the game needs is a handful of files, so they are all
// cached on install and served from the cache from then on: the Home Screen app opens instantly
// and works with no signal. tools/pages.mjs stamps BUILD_ID with a hash of the build, so every new
// version is a new service worker; the browser installs it in the background, and the next launch
// runs the new version.
const BUILD_ID = '__BUILD_ID__';
const CACHE = 'claudecity-' + BUILD_ID;
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('claudecity-') || k.startsWith('cubopolis-')) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then(
        (hit) =>
          hit ||
          fetch(req).catch(() =>
            req.mode === 'navigate' ? cache.match('./index.html') : Response.error(),
          ),
      ),
    ),
  );
});
