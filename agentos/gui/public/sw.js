// v1.11.35 (WS-05): bumped agentos-v1 -> agentos-v2 so browsers holding an
// old cache drop it on first visit and start fetching fresh assets. Any future
// cache-invalidating change MUST bump this string again.
const CACHE_NAME = "agentos-v2";
const PRECACHE = ["/chat", "/manifest.json", "/icons/icon-192.svg", "/icons/icon-512.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
         if (r.ok && r.status !== 206 && e.request.url.startsWith(self.location.origin)) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
