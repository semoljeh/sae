document.addEventListener("DOMContentLoaded", function () {
    // Navigasi Bawah Aktif
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Deteksi Klik Menu Utama
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka: " + this.getAttribute('data-menu'));
        });
    });
});