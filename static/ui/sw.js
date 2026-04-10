self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => response.ok ? response : caches.match("/404.html"))
        .catch(() => caches.match("/404.html"))
    );
  }
});

// Pre-cache the 404 page on install so it works even offline
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v1").then(cache => cache.add("/404.html"))
  );
  self.skipWaiting();
});