// Ganti nama cache untuk memaksa pembaruan secara instan
const CACHE_NAME = "almukhtar-cache-v4"; // Versi saya naikkan ke v4 agar cache lama tertimpa

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

  // Hindari memproses request ekstensi browser atau selain metode GET
  if (request.method !== "GET" || request.url.startsWith('chrome-extension')) {
      return;
  }

  // STRATEGI "NETWORK FIRST, CACHE FALLBACK"
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // PERBAIKAN 1: Hapus batasan origin. 
        // Sekarang data dari GitHub Raw dan API Aladhan akan ikut tersimpan!
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });
        
        return networkResponse;
      })
      .catch(() => {
        // PERBAIKAN 2: Tambahkan { ignoreSearch: true } 
        // Agar sistem mengabaikan parameter ?v=47.0 pada style.css dan script.js saat offline
        return caches.match(request, { ignoreSearch: true }).then(cached => {
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
