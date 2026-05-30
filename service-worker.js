const CACHE_NAME = "almukhtar-cache-v4"; // Versi cache dinaikkan untuk memaksa update

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
  self.skipWaiting(); // Memaksa service worker baru langsung aktif
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
            return caches.delete(key); // Hapus cache versi lama
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // STRATEGI NETWORK-FIRST (Utamakan Server Baru, Cadangan Cache)
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Jika sukses ambil dari server, simpan/update ke memori Cache
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
        // Jika gagal/offline, barulah ambil dari Cache
        return caches.match(request).then(cached => {
          if (cached) {
            return cached;
          }
          // Jika sama sekali tidak ada, arahkan ke index.html
          if (request.destination === "document") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
