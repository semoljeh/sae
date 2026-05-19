document.addEventListener("DOMContentLoaded", function () {
    
    // 1. Logika Klik Tombol Refresh (Update / Sinkron Data)
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function () {
            // Mengambil elemen ikon di dalam tombol
            const icon = this.querySelector('span');
            
            // Tambahkan class animasi berputar dari CSS
            icon.classList.add('spin-animation');
            
            // Jalankan fungsi refresh halaman penuh setelah 600 milidetik (efek visual berputar selesai)
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
