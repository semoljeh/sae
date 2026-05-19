document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. LOGIKA POPUP MODAL (ZOOM IN / ZOOM OUT DARI TOMBOL INFO)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupBox = document.getElementById('popup-box');

    if (infoButton && popupOverlay && popupBox) {
        // Membuka Popup (Zoom In)
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); // Mencegah bentrokan event click global
            popupOverlay.classList.add('show');
        });

        // Menutup Popup jika Area Luar / Overlay Hitam diklik (Zoom Out)
        popupOverlay.addEventListener('click', function (e) {
            // Memastikan klik benar-benar di luar kotak putih popup
            if (e.target === popupOverlay) {
                popupOverlay.classList.remove('show');
            }
        });
        
        // Menutup otomatis jika pengguna menekan kembali tombol info saat popup terbuka
        window.addEventListener('click', function () {
            popupOverlay.classList.remove('show');
        });
        popupBox.addEventListener('click', function (e) {
            e.stopPropagation(); // Menjaga agar isi didalam popup tetap bisa diklik bebas
        });
    }

    // ==========================================================================
    // 2. FUNGSI KLIK SINKRONISASI DATA REFRESH BERPUTAR
    // ==========================================================================
    const refreshButton = document.getElementById('refresh-button');
    const refreshIcon = document.getElementById('refresh-icon');

    if (refreshButton && refreshIcon) {
        refreshButton.addEventListener('click', function () {
            refreshIcon.classList.add('spin-animation');
            setTimeout(() => {
                location.reload();
            }, 600);
        });
    }

    // ==========================================================================
    // 3. NAVIGASI BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ==========================================================================
    // 4. DETEKSI KLIK MENU UTAMA GRID
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka: " + this.getAttribute('data-menu'));
        });
    });
});
