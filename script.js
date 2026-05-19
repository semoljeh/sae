document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. SISTEM BLOKIR TRIPLE-LAYER ANTI COPAS (MURNI JAVASCRIPT PROTEKSI)
    // ==========================================================================

    // Fungsi mematikan klik kanan mouse dan mematikan perintah tahan layar lama (long press) di HP
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Menggagalkan instruksi dasar sistem operasi untuk mengeluarkan opsi salin/copy
    });

    // Fungsi mematikan instruksi awal penyeretan/pemblokan teks tulisan
    document.addEventListener('selectstart', function (e) {
        e.preventDefault(); // Menggagalkan instruksi saat jari mendeteksi seretan teks halaman
    });

    // Fungsi mematikan pintasan tombol salin keyboard komputer
    document.addEventListener('keydown', function (e) {
        // Melarang total tombol kombinasi Ctrl+C (Salin), Ctrl+A (Pilih Semua), Ctrl+U (Source Code)
        if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });


    // ==========================================================================
    // 2. KENDALI JENDELA POPUP MODAL IMUT (SISTEM KLIK GLOBAL CLOSE NATAL)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    // Fungsi menyuntikkan kelas CSS aktif untuk memekarkan jendela popup info
    function openPopup() {
        popupBox.classList.add('show'); 
        popupBackdrop.classList.add('show'); 
    }

    // Fungsi mencopot kelas CSS aktif untuk menyusutkan kembali jendela popup
    function closePopup() {
        popupBox.classList.remove('show'); 
        popupBackdrop.classList.remove('show'); 
    }

    // Memastikan elemen sukses terpasang di dokumen sebelum menyuntik logis klik sentuhan
    if (infoButton && popupBox && popupBackdrop) {
        
        // Klik pada ikon i bulat toska
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); // Menahan gelembung klik agar tidak memicu detektor dokumen global
            if (popupBox.classList.contains('show')) {
                closePopup(); // Menutup normal jika sedang terbuka
            } else {
                openPopup(); // Membuka normal jika sedang tertutup
            }
        });

        // Klik area tirai redup belakang untuk menutup popup balik (Mode HP)
        popupBackdrop.addEventListener('click', function () {
            closePopup();
        });

        // KUNCI UTAMA: Ketuk di koordinat layar mana saja secara bebas otomatis meredupkan popup info kembali (Anti Keluar Aplikasi)
        document.addEventListener('click', function (e) {
            // Jika popup sedang aktif mekar, dan jari mengetuk area yang BUKAN bagian dari tombol info utama
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                
                // Mencegah penutupan sepihak jika user terdeteksi mengetuk tautan akun medsos tiktok/ig
                if (e.target.closest('.social-icon')) {
                    return; 
                }
                
                // Menutup popup secara murni lewat internal program (Aman & Tidak keluar halaman web)
                closePopup();
            }
        });
    }


    // ==========================================================================
    // 3. LOGIKA REFRESH DATA HALAMAN BERPUTAR
    // ==========================================================================
    const refreshButton = document.getElementById('refresh-button');
    const refreshIcon = document.getElementById('refresh-icon');

    if (refreshButton && refreshIcon) {
        refreshButton.addEventListener('click', function () {
            refreshIcon.classList.add('spin-animation'); // Memutar ikon refresh lewat kelas roda animasi CSS
            setTimeout(() => {
                location.reload(); // Memuat ulang halaman web secara utuh dan segar setelah 0.6 detik
            }, 600);
        });
    }


    // ==========================================================================
    // 4. ANIMASI PINDAH TOMBOL TAB NAVIGASI BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            // Membersihkan status nyala kelas 'active' dari tombol navigasi lama
            navItems.forEach(nav => nav.classList.remove('active'));
            // Menyematkan status kelas 'active' ke tombol navigasi baru yang ditekan jari pengguna
            this.classList.add('active');
        });
    });


    // ==========================================================================
    // 5. NOTIFIKASI EVENT KLIK KOTAK MENU GRID UTAMA
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            // Memunculkan kotak peringatan bertuliskan nama data-menu saat di-klik
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
