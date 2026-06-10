// Naikkan versi cache agar HP pengguna me-reset memori lamanya
const CACHE_NAME = "almukhtar-cache-v11"; 

// ⬇️ DAFTAR "BARANG BAWAAN WAJIB" SAAT OFFLINE ⬇️
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./audio/notif.mp3",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  
  // WAJIB DITAMBAHKAN: Font Arab & Desain Lokal agar tidak berantakan
  "./font/lpmq.ttf",
  "./font/alqalam.ttf",
  "./font/surah-name-v4.woff2"
];

self.addEventListener("install", event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim(); 
});

// STRATEGI CACHE-FIRST: Menangkap Font Google & FontAwesome Otomatis
self.addEventListener("fetch", event => {
  const request = event.request;
  
  if (request.method !== "GET" || request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      // Jika font/desain sudah ada di memori HP, langsung pakai!
      if (cached) return cached;

      // Jika belum ada, ambil dari internet secara diam-diam
      return fetch(request).then(networkResponse => {
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
          return networkResponse;
        }
        
        // Simpan font/desain luar (seperti FontAwesome & Tailwind) ke dalam memori
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        
        return networkResponse;

      }).catch(() => {
        // Jika internet mati total, alihkan ke layar utama
        if (request.destination === "document") return caches.match("./index.html");
      });
    })
  );
});