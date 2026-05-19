document.addEventListener("DOMContentLoaded", function () {
    
    // 1. Fungsi Klik Tombol Refresh / Sinkron Data Berputar
    const refreshButton = document.getElementById('refresh-button');
    const refreshIcon = document.getElementById('refresh-icon');

    if (refreshButton && refreshIcon) {
        refreshButton.addEventListener('click', function () {
            // Pasang class animasi berputar tepat pada target icon
            refreshIcon.classList.add('spin-animation');
            
            // Refresh halaman setelah animasi berputar selesai (0.6 detik)
            setTimeout(() => {
                location.reload();
            }, 600);
        });
    }

    // 2. Navigasi Bawah Aktif
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 3. Deteksi Klik Menu Utama
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka: " + this.getAttribute('data-menu'));
        });
    });
});
