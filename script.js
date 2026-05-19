document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================================================
    // 1. FUNGSIONALITAS TRIPLE-LOCK ANTI COPAS (MURNI PROTEKSI JAVASCRIPT)
    // ==========================================================================

    // Mematikan menu klik kanan mouse dan menonaktifkan gerakan tahan layar lama (long press) di HP
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault(); 
    });

    // Mematikan instruksi awal pemblokan seleksi baris teks tulisan
    document.addEventListener('selectstart', function (e) {
        e.preventDefault(); 
    });

    // Mematikan pintasan kombinasi tombol salin pada keyboard komputer
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 85 || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });


    // ==========================================================================
    // 2A. KENDALI KAPSUL POPUP PROFIL DEVELOPER
    // ==========================================================================
    const infoButton = document.getElementById('info-button');
    const popupBox = document.getElementById('popup-box');
    const popupBackdrop = document.getElementById('popup-backdrop');
    const closeProfileBtn = document.getElementById('close-profile-btn'); 

    // Fungsi membuka jendela modal profile dan mengunci riwayat browser HP
    function openPopup() {
        popupBox.classList.add('show'); 
        popupBackdrop.classList.add('show'); 
        if (!history.state || !history.state.popupActive) {
            history.pushState({ popupActive: true }, "");
        }
    }

    // Fungsi menutup jendela modal profile secara internal secara bersih
    function closePopup() {
        popupBox.classList.remove('show'); 
        popupBackdrop.classList.remove('show'); 
    }

    if (infoButton && popupBox && popupBackdrop && closeProfileBtn) {
        infoButton.addEventListener('click', function (e) {
            e.stopPropagation(); 
            if (popupBox.classList.contains('show')) {
                history.back(); 
            } else {
                openPopup(); 
            }
        });

        closeProfileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (popupBox.classList.contains('show')) {
                history.back(); 
            }
        });

        popupBackdrop.addEventListener('click', function () {
            if (popupBox.classList.contains('show')) {
                history.back();
            }
        });

        document.addEventListener('click', function (e) {
            if (popupBox.classList.contains('show') && !infoButton.contains(e.target)) {
                if (e.target.closest('.social-icon')) {
                    return; 
                }
                history.back(); 
            }
        });
    }


    // ==========================================================================
    // 2B. KENDALI BOTTOM SHEET LOKASI OTOMATIS GPS (TERURUT ABJAD ALFABET A-Z)
    // ==========================================================================
    const locationButton = document.getElementById('location-button');
    const locationText = document.getElementById('location-text');
    const locationSheet = document.getElementById('location-sheet');
    const locationBackdrop = document.getElementById('location-backdrop');
    const gpsDetectBtn = document.getElementById('gps-detect-btn');
    const gpsBtnText = document.getElementById('gps-btn-text');
    const locationSearchInput = document.getElementById('location-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const suggestionList = document.getElementById('suggestion-list');
    const saveLocationBtn = document.getElementById('save-location-btn');

    let temporarySelectedLocation = ""; 

    // Fungsi membuka sheet lokasi
    function openLocationSheet() {
        locationSheet.classList.add('show');
        locationBackdrop.classList.add('show');
        if (!history.state || !history.state.locationActive) {
            history.pushState({ locationActive: true }, "");
        }
        // Jalankan pelacakan wilayah terdekat berbasis satelit GPS secara real-time
        panggilLokasiOtomatisGPS();
    }

    // Fungsi menutup sheet lokasi secara bersih
    function closeLocationSheet() {
        locationSheet.classList.remove('show');
        locationBackdrop.classList.remove('show');
        locationSearchInput.value = "";
        suggestionList.innerHTML = "";
        suggestionList.classList.remove('has-items');
        clearSearchBtn.style.display = "none";
    }

    // ENGINE UTAMA: Mengambil koordinat GPS lalu menembak API Geocoding OpenStreetMap Nominatim
    function panggilLokasiOtomatisGPS() {
        if (!navigator.geolocation) {
            suggestionList.innerHTML = '<li class="no-match-item">Sensor GPS tidak didukung browser HP ini.</li>';
            return;
        }

        suggestionList.classList.add('has-items');
        suggestionList.innerHTML = '<li class="no-match-item"><span class="spin-animation material-icons-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px;">refresh</span> Melacak desa terdekat via satelit GPS...</li>';

        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Memanggil REST API Reverse Geocoding gratis dan akurat tingkat desa/kelurahan
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

                fetch(url, { headers: { 'Accept-Language': 'id' } })
                .then(response => response.json())
                .then(data => {
                    suggestionList.innerHTML = ""; 
                    
                    if (data && data.address) {
                        const adr = data.address;
                        
                        // Memetakan pecahan hirarki wilayah desa/kecamatan Indonesia
                        const namaDesa = adr.village || adr.suburb || adr.neighbourhood || adr.municipality || "Desa Tidak Bernama";
                        const namaKecamatan = adr.subdistrict || adr.district || "Kecamatan Tidak Diketahui";
                        const namaKabupaten = adr.city || adr.regency || "";

                        // Menyusun struktur teks daftar rekomendasi lokasi sekitar GPS
                        let listRekomendasi = [
                            `${namaDesa}, ${namaKecamatan}`,
                            `Kel. ${namaDesa}, ${namaKecamatan}`,
                            `${namaKecamatan}, ${namaKabupaten}`
                        ];

                        // ATURAN ABJAD: Menyusun urutan nama alfabetis dari A-Z
                        listRekomendasi.sort();

                        // Tampilkan hasil olahan GPS ke dalam list saran visual
                        listRekomendasi.forEach(itemLokasi => {
                            const li = document.createElement('li');
                            li.className = "suggestion-item";
                            li.innerHTML = `<span class="material-icons-outlined geo-mark">my_location</span> <span>${itemLokasi}</span>`;
                            
                            li.addEventListener('click', function () {
                                locationSearchInput.value = itemLokasi;
                                temporarySelectedLocation = itemLokasi;
                                clearSearchBtn.style.display = "block";
                                saveLocationBtn.disabled = false; 
                                
                                document.querySelectorAll('.suggestion-item').forEach(el => el.style.backgroundColor = 'transparent');
                                li.style.backgroundColor = '#e0f2fe';
                            });
                            
                            suggestionList.appendChild(li);
                        });

                    } else {
                        suggestionList.innerHTML = '<li class="no-match-item">Gagal menerjemahkan titik koordinat desa.</li>';
                    }
                })
                .catch(error => {
                    suggestionList.innerHTML = '<li class="no-match-item">Koneksi internet terputus saat mengambil data desa.</li>';
                });
            },
            function (error) {
                suggestionList.innerHTML = '<li class="no-match-item">Izin GPS ditolak atau sinyal satelit di dalam ruangan lemah.</li>';
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }

    if (locationButton) {
        locationButton.addEventListener('click', function (e) {
            e.stopPropagation();
            openLocationSheet();
        });

        locationBackdrop.addEventListener('click', function () {
            if (locationSheet.classList.contains('show')) {
                history.back();
            }
        });

        gpsDetectBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            panggilLokasiOtomatisGPS();
        });

        // Kolom Ketik Manual Cek Data
        locationSearchInput.addEventListener('input', function () {
            const keyword = this.value.toLowerCase().trim();
            if (keyword.length > 0) {
                clearSearchBtn.style.display = "block";
                temporarySelectedLocation = this.value;
                saveLocationBtn.disabled = false;
            } else {
                clearSearchBtn.style.display = "none";
                saveLocationBtn.disabled = true;
            }
        });

        clearSearchBtn.addEventListener('click', function () {
            locationSearchInput.value = "";
            this.style.display = "none";
            saveLocationBtn.disabled = true;
            panggilLokasiOtomatisGPS(); 
        });

        // Tombol Simpan Resmi Klik Aksi
        saveLocationBtn.addEventListener('click', function () {
            if (temporarySelectedLocation) {
                const namaDesaSaja = temporarySelectedLocation.split(',')[0].replace('Kel. ', '').replace(' (GPS)', '');
                locationText.innerText = namaDesaSaja;
                alert(`Lokasi Al-Mukhtar disetel ke: ${temporarySelectedLocation}`);
                history.back(); 
            }
        });
    }


    // ==========================================================================
    // 3. SINKRONISASI MUTLAK BACK-BUTTON HP GESTURE (ANTI KELUAR WEB)
    // ==========================================================================
    window.addEventListener('popstate', function (event) {
        if (popupBox.classList.contains('show')) {
            closePopup();
        }
        if (locationSheet.classList.contains('show')) {
            closeLocationSheet();
        }
    });


    // ==========================================================================
    // 4. LOGIKA REFRESH DATA HALAMAN BERPUTAR 
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
    // 5. ANIMASI TAB MENU NAVIGASI BAWAH AKTIF
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });


    // ==========================================================================
    // 6. DETEKTOR KLIK FITUR ITEM MENU GRID UTAMA
    // ==========================================================================
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            alert("Membuka Fitur: " + this.getAttribute('data-menu'));
        });
    });
});
