document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. POPUP INTERAKTIF KANAN-BAWAH + HANDLER TOMBOL BACK SMARTPHONE
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    function openPopup() {
        popupBox.classList.add('show');
        popupBackdrop.classList.add('show');
        // Menyisipkan state history agar tombol back fisik HP hanya menutup popup
        history.pushState({ popupActive: true }, "");
    }

    function closePopup() {
        popupBox.classList.remove('show');
        popupBackdrop.classList.remove('show');
    }

    if (infoButton && popupBox && popupBackdrop) {
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (popupBox.classList.contains('show')) {
                history.back(); 
            } else {
                openPopup();
            }
        });

        popupBackdrop.addEventListener('click', function () {
            history.back();
        });

        window.addEventListener('popstate', function () {
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
