const CACHE = "pokerstack-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          "/manifest.webmanifest",
          "/icon-192.png",
          "/icon-512.png",
          "/apple-touch-icon.png",
        ]),
      ),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("pokerstack-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|webmanifest|woff2)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(CACHE)
                .then((cache) => cache.put(event.request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
// The first visit may load scripts before this worker takes control. Cache those
// same-origin assets once the client reports them so the next cold load is offline.
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_ASSETS" && Array.isArray(event.data.urls))
    event.waitUntil(
      caches.open(CACHE).then((cache) =>
        Promise.all(
          event.data.urls
            .filter((url) => {
              try {
                const u = new URL(url);
                return (
                  u.origin === self.location.origin &&
                  u.pathname.startsWith("/_next/static/")
                );
              } catch {
                return false;
              }
            })
            .map((url) => cache.add(url).catch(() => {})),
        ),
      ),
    );
});
