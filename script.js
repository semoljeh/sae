document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. POPUP INTERAKTIF (ZOOM IN/OUT DARI ICON I + DETEKSI TOMBOL BACK HP)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    // Fungsi membuka popup
    function openPopup() {
        popupBox.classList.add('show');
        popupBackdrop.classList.add('show');

        // Menyisipkan state bayangan ke history browser Android/HP
        // Tujuannya agar saat tombol back HP ditekan, aplikasi tidak langsung keluar
        history.pushState({ popupActive: true }, "");
    }

    // Fungsi menutup popup (Menyusut/Zoom Out kembali ke icon i)
    function closePopup() {
        popupBox.classList.remove('show');
        popupBackdrop.classList.remove('show');
    }

    if (infoButton && popupBox && popupBackdrop) {
        // Klik tombol i untuk membuka atau menutup
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (popupBox.classList.contains('show')) {
                // Jika sudah terbuka, tekan tombol i lagi untuk menutup (menyusut balik)
                history.back(); 
            } else {
                openPopup();
            }
        });

        // Klik area luar/latar blur untuk menyusutkan balik popup
        popupBackdrop.addEventListener('click', function () {
            history.back();
        });

        // MENDETEKSI TOMBOL BACK SPESIFIK SMARTPHONE / HP
        window.addEventListener('popstate', function () {
            // Ketika tombol back fisik HP ditekan, tutup popup secara halus
            closePopup();
        });
    }

    // ==========================================================================
    // 2. FUNGSIONALITAS REFRESH SINKRONISASI DATA BERPUTAR
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
    // 4. DETEKSI KLIK MENU UTAMA
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka: " + this.getAttribute('data-menu'));
        });
    });
});
