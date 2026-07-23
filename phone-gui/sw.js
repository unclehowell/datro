const CACHE = "agentos-phone-v1";
const PRECACHE = ["/", "/manifest.json"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
    const clone = resp.clone();
    caches.open(CACHE).then((c) => c.put(e.request, clone));
    return resp;
  })));
});
