document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. LOGIKA INTERAKTIF POPUP (KLIK DI MANA SAJA UNTUK MENUTUP)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    function openPopup() {
        popupBox.classList.add('show');
        popupBackdrop.classList.add('show');
        // Menyisipkan state history agar tombol back fisik HP hanya menutup modal
        history.pushState({ popupActive: true }, "");
    }

    function closePopup() {
        popupBox.classList.remove('show');
        popupBackdrop.classList.remove('show');
    }

    if (infoButton && popupBox && popupBackdrop) {
        // Tombol info diklik
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); // Mencegah event klik global langsung menutup popup saat baru dibuka
            if (popupBox.classList.contains('show')) {
                history.back(); 
            } else {
                openPopup();
            }
        });

        // SOLUSI MUTLAK: Klik di mana saja di seluruh area layar untuk menutup popup
        document.addEventListener('click', function (e) {
            // Jika popup sedang terbuka, dan yang diklik BUKAN bagian dari tombol info itu sendiri
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                
                // Jika yang diklik adalah tombol sosmed, biarkan dia membuka link terlebih dahulu
                if (e.target.closest('.social-icon')) {
                    return; 
                }
                
                // Jika mengetuk di mana saja selain tombol sosmed, tutup popup secara halus
                history.back();
            }
        });

        // Sinkronisasi dengan tombol back sistem perangkat (Android/Smartwatch gesture)
        window.addEventListener('popstate', function () {
            closePopup();
        });
    }

    // ==========================================================================
    // 2. FUNGSIONALITAS REFRESH UPDATE DATA BERPUTAR
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
    // 3. LOGIKA INTERAKTIF MENYALAKAN MENU NAVIGASI BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ==========================================================================
    // 4. EVENT DETEKSI KLIK BANNER MENU UTAMA GRID 2x3
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
