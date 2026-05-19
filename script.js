document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. FUNGSIONALITAS TRIPLE-LOCK ANTI COPAS (MURNI PROTEKSI JAVASCRIPT)
    // ==========================================================================

    // Mematikan menu klik kanan mouse dan menonaktifkan gerakan tahan layar lama (long press) di HP
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Menggagalkan instruksi dasar bawaan sistem operasi untuk mengeluarkan instruksi copy
    });

    // Mematikan instruksi awal pemblokan seleksi baris teks tulisan
    document.addEventListener('selectstart', function (e) {
        e.preventDefault(); // Menggagalkan instruksi saat jari mendeteksi seretan seleksi halaman
    });

    // Mematikan pintasan kombinasi tombol salin pada keyboard komputer
    document.addEventListener('keydown', function (e) {
        // Melarang total tombol kombinasi Ctrl+C (Salin), Ctrl+A (Pilih Semua), Ctrl+U (Source Code)
        if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });


    // ==========================================================================
    // 2. KENDALI KAPSUL POPUP PROFIL VERTIVAL (SISTEM AUTOMATIC MUTUAL CLOSE)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');
    const closeProfileBtn = document.getElementById('close-profile-btn'); // Detektor tombol Tutup Profil bawah

    // Fungsi membuka jendela modal profile
    function openPopup() {
        popupBox.classList.add('show'); // Menyuntikkan kelas 'show' untuk memicu kurva pegas CSS
        popupBackdrop.classList.add('show'); // Membuka tirai redup belakang
    }

    // Fungsi menutup jendela modal profile secara internal (Anti-Keluar Aplikasi)
    function closePopup() {
        popupBox.classList.remove('show'); // Mencopot kelas 'show' agar jendela menyusut mengecil
        popupBackdrop.classList.remove('show'); // Mematikan tirai redup belakang
    }

    // Memastikan seluruh elemen sukses dimuat sistem sebelum mengunci sensor klik sentuhan
    if (infoButton && popupBox && popupBackdrop && closeProfileBtn) {
        
        // Sinyal sentuh pada tombol info i kiri atas
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); // Menahan gelembung klik agar tidak menyengat sensor dokumen global
            if (popupBox.classList.contains('show')) {
                closePopup(); // Menutup normal jika sedang terbuka
            } else {
                openPopup(); // Membuka normal jika sedang tertutup
            }
        });

        // BARU: Sinyal sentuh langsung pada tombol "Tutup Profil" di bagian paling bawah popup
        closeProfileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closePopup(); // Langsung eksekusi penutupan murni
        });

        // Sinyal ketuk pada tirai backdrop redup belakang untuk menutup modal balik (Mode HP)
        popupBackdrop.addEventListener('click', function () {
            closePopup();
        });

        // Ketuk di koordinat layar mana saja secara bebas otomatis meredupkan popup info kembali
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
    // 3. LOGIKA REFRESH DATA HALAMAN BERPUTAR (KEMBALI DI POJOK KANAN ATAS)
    // ==========================================================================
    const refreshButton = document.getElementById('refresh-button');
    const refreshIcon = document.getElementById('refresh-icon');

    if (refreshButton && refreshIcon) {
        refreshButton.addEventListener('click', function () {
            refreshIcon.classList.add('spin-animation'); // Memutar ikon refresh lewat kelas roda animasi CSS
            setTimeout(() => {
                location.reload(); // Memuat ulang halaman web secara utuh setelah 0.6 detik
            }, 600);
        });
    }


    // ==========================================================================
    // 4. ANIMASI TAB MENU NAVIGASI BAWAH AKTIF
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
    // 5. DETEKTOR KLIK FITUR ITEM MENU GRID UTAMA 
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            // Memunculkan kotak peringatan bertuliskan nama data-menu saat di-klik
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
