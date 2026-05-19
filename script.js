document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. POPUP CONTROL INTERAKTIF (KLIK DI MANA SAJA UNTUK MENUTUP MODAL)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    function openPopup() {
        popupBox.classList.add('show');
        popupBackdrop.classList.add('show');
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

        // Sentuh di koordinat layar mana saja untuk otomatis menyusutkan popup balik
        document.addEventListener('click', function (e) {
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                if (e.target.closest('.social-icon')) {
                    return; 
                }
                history.back();
            }
        });

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
    // 3. SELEKSI NAVIGASI BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ==========================================================================
    // 4. DETEKSI KLIK BANNER MENU UTAMA GRID 2x3
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
