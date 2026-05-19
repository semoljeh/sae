document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. FUNGSIONALITAS TRIPLE-LOCK ANTI COPAS (MURNI PROTEKSI JAVASCRIPT)
    // ==========================================================================

    // Fungsi mematikan klik kanan mouse dan mematikan perintah tahan layar lama (long press) di HP
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Menggagalkan instruksi dasar sistem operasi untuk mengeluarkan opsi salin/copy
    });

    // Fungsi mematikan instruksi awal penyeretan/pemblokan teks tulisan
    document.addEventListener('selectstart', function (e) {
        e.preventDefault(); // Menggagalkan instruksi saat jari mendeteksi seretan seleksi halaman
    });

    // Fungsi mematikan pintasan kombinasi tombol salin pada keyboard komputer
    document.addEventListener('keydown', function (e) {
        // Melarang total tombol kombinasi Ctrl+C (Salin), Ctrl+A (Pilih Semua), Ctrl+U (Source Code)
        if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });


    // ==========================================================================
    // 2. KENDALI KAPSUL POPUP PROFIL (SISTEM KUNCI TOMBOL REKBALI HP ANTI-KELUAR)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');
    const closeProfileBtn = document.getElementById('close-profile-btn'); 

    // FUNGSI UTAMA: Membuka jendela modal profile dan mengunci riwayat browser HP
    function openPopup() {
        popupBox.classList.add('show'); // Menyuntikkan kelas 'show' untuk memicu kurva pegas CSS
        popupBackdrop.classList.add('show'); // Membuka tirai redup belakang
        
        // TRIK KUNCI: Menyisipkan state riwayat palsu ke browser agar tombol back HP terkunci di dalam popup
        if (!history.state || !history.state.popupActive) {
            history.pushState({ popupActive: true }, "");
        }
    }

    // FUNGSI UTAMA: Menutup jendela modal profile secara internal secara bersih
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
                history.back(); // Jika sedang terbuka, paksa mundur riwayat (otomatis memicu penutupan lewat popstate)
            } else {
                openPopup(); // Jika sedang tertutup, jalankan fungsi buka
            }
        });

        // Sinyal sentuh langsung pada tombol "Tutup Profil" di bagian bawah popup
        closeProfileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (popupBox.classList.contains('show')) {
                history.back(); // Memaksa mundur riwayat agar sinkron dengan sistem tombol back HP
            }
        });

        // Sinyal ketuk pada tirai backdrop redup belakang untuk menutup modal balik (Mode HP)
        popupBackdrop.addEventListener('click', function () {
            if (popupBox.classList.contains('show')) {
                history.back();
            }
        });

        // Ketuk di koordinat layar kosong mana saja otomatis memicu kemunduran riwayat
        document.addEventListener('click', function (e) {
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                if (e.target.closest('.social-icon')) {
                    return; // Abaikan jika yang diklik link sosmed
                }
                history.back(); // Mundurkan riwayat browser
            }
        });

        // FIX MUTLAK J2 PRO & ANDROID SYSTEM: Menangkap sinyal tombol "Back" fisik/gesture HP
        window.addEventListener('popstate', function (event) {
            // Jika state palsu 'popupActive' terdeteksi hilang akibat user pencet tombol back di HP
            closePopup(); // Jalankan perintah tutup popup secara murni di dalam internal web tanpa keluar aplikasi
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
