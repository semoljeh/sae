document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. FUNGSIONALITAS BLOKIR ANTI-COPAS (KEAMANAN MURNI JAVASCRIPT)
    // ==========================================================================

    // Fungsi mematikan klik kanan mouse dan menahan layar lama (long press) di HP
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault(); // Membatalkan perintah asli browser untuk memunculkan pilihan menu copy
    });

    // Fungsi mematikan awal mula gerakan blok/seleksi teks tulisan
    document.addEventListener('selectstart', function (e) {
        e.preventDefault(); // Menolak perintah saat jari/kursor mencoba menarik garis blok tulisan
    });

    // Fungsi mematikan jalan pintas tombol salin di keyboard komputer
    document.addEventListener('keydown', function (e) {
        // Mematikan paksa tombol Ctrl+C (Copy) dan Ctrl+A (Select All)
        if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });


    // ==========================================================================
    // 2. KENDALI POPUP MODAL (FIXED ANTI-KELUAR APLIKASI SAAT DIKLIK LUAR)
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');

    // Fungsi untuk memicu munculnya jendela popup info tentang aplikasi
    function openPopup() {
        popupBox.classList.add('show'); // Memasang kelas CSS 'show' untuk memicu animasi membal mekar
        popupBackdrop.classList.add('show'); // Menyalakan layar redup tipis di belakang
    }

    // Fungsi untuk menyembunyikan/menutup kembali jendela popup info
    function closePopup() {
        popupBox.classList.remove('show'); // Mencopot kelas 'show' agar jendela menyusut mengecil
        popupBackdrop.classList.remove('show'); // Mematikan layar redup belakang
    }

    // Memastikan elemen sukses dimuat sistem sebelum memasang logika klik sentuhan
    if (infoButton && popupBox && popupBackdrop) {
        
        // Logika saat tombol i bulat diklik jari
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); // Mencegah gelembung klik tembus ke dokumen global
            if (popupBox.classList.contains('show')) {
                closePopup(); // Jika sedang terbuka, klik tombol i lagi akan menutupnya secara normal
            } else {
                openPopup(); // Jika sedang tertutup, jalankan fungsi buka
            }
        });

        // FIX TERBARU: Sentuh di area mana saja di seluruh layar perangkat untuk menutup popup
        document.addEventListener('click', function (e) {
            // Jika popup sedang aktif terbuka, dan area yang disentuh jari BUKAN bagian tombol info itu sendiri
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                
                // Jika jari sengaja menyentuh tombol ikon media sosial, biarkan link terbuka (abaikan penutupan)
                if (e.target.closest('.social-icon')) {
                    return; 
                }
                
                // Jika mengetuk area kosong mana saja selain tombol sosmed, langsung tutup popup secara murni (Anti-Keluar Aplikasi!)
                closePopup();
            }
        });
    }


    // ==========================================================================
    // 3. INTERAKSI ANIMASI BERPUTAR TOMBOL REFRESH HALAMAN
    // ==========================================================================
    const refreshButton = document.getElementById('refresh-button');
    const refreshIcon = document.getElementById('refresh-icon');

    if (refreshButton && refreshIcon) {
        refreshButton.addEventListener('click', function () {
            refreshIcon.classList.add('spin-animation'); // Menyuntikkan kelas CSS roda animasi berputar
            setTimeout(() => {
                location.reload(); // Memuat ulang halaman web secara penuh setelah 0.6 detik putaran selesai
            }, 600);
        });
    }


    // ==========================================================================
    // 4. ANIMASI PINDAH TAB NAVIGASI MENU BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            // Menghapus status kelas 'active' hijau toska dari tombol navigasi lama
            navItems.forEach(nav => nav.classList.remove('active'));
            // Menyematkan kelas 'active' ke tombol navigasi baru yang sedang ditekan jari
            this.classList.add('active');
        });
    });


    // ==========================================================================
    // 5. DETEKTOR KLIK FITUR ITEM MENU GRID UTAMA 
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            // Menampilkan kotak notifikasi nama fitur saat kotak menu di-klik jari
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
