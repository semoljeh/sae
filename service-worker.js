// Ganti nama cache untuk memaksa pembaruan secara instan
const CACHE_NAME = "almukhtar-cache-v3"; 

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
  // Memaksa Service Worker baru untuk langsung aktif tanpa menunggu
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
          // Menghapus cache versi lama secara otomatis
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Memaksa SW baru segera mengambil alih klien
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // STRATEGI "NETWORK FIRST, CACHE FALLBACK"
  // 1. Coba ambil dari jaringan/server terlebih dahulu
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Jika berhasil mengambil dari server (ada jaringan), simpan/perbarui ke Cache
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
        // 2. Jika gagal mengambil dari server (misal karena offline), ambil dari Cache
        return caches.match(request).then(cached => {
          if (cached) {
            return cached;
          }
          // Fallback terakhir: arahkan ke index.html jika tidak ada di Cache
          if (request.destination === "document") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
