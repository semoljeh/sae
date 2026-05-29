
const CACHE_NAME = "almukhtar-cache-v2";

const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./audio/notif.mp3",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then(networkResponse => {
          if (
            request.method === "GET" &&
            request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (request.destination === "document") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
