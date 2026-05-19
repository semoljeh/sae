document.addEventListener("DOMContentLoaded", function () {
    // ANTI-COPAS KETAT
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && [67, 65, 85, 83].includes(e.keyCode)) { e.preventDefault(); return false; }
    });

    // ENGINE NOTIFIKASI MODERN
    const alertBackdrop = document.getElementById('custom-alert-backdrop');
    function tampilNotif(judul, pesan, icon = "check_circle", color = "#007A78") {
        document.getElementById('custom-alert-title').innerText = judul;
        document.getElementById('custom-alert-message').innerText = pesan;
        const iconEl = document.getElementById('custom-alert-icon');
        iconEl.innerText = icon;
        document.querySelector('.alert-icon-circle').style.color = color;
        alertBackdrop.classList.add('show');
    }
    document.getElementById('alert-confirm-btn').onclick = () => alertBackdrop.classList.remove('show');

    // POPUP PROFIL KIRI ATAS
    const btnInfo = document.getElementById('info-button');
    const popProfile = document.getElementById('popup-box');
    const popBackdrop = document.getElementById('popup-backdrop');
    
    function toggleProfile(show) {
        popProfile.classList.toggle('show', show);
        popBackdrop.classList.toggle('show', show);
        if(show) history.pushState({ modal: true }, "");
    }
    btnInfo.onclick = (e) => { e.stopPropagation(); toggleProfile(!popProfile.classList.contains('show')); };
    document.getElementById('close-profile-btn').onclick = () => { history.back(); };
    popBackdrop.onclick = () => { history.back(); };

    // MODAL LOKASI (TENGAH / ZOOM) + GPS & LOCALSTORAGE
    const btnLoc = document.getElementById('location-button');
    const locText = document.getElementById('location-text');
    const locModal = document.getElementById('location-sheet');
    const locBack = document.getElementById('location-backdrop');
    const inputLoc = document.getElementById('location-search-input');
    const listLoc = document.getElementById('suggestion-list');
    const btnSaveLoc = document.getElementById('save-location-btn');
    const btnClearLoc = document.getElementById('clear-search-btn');
    
    let shortLocation = ""; 

    // Fungsi pemotong nama lokasi (Ambil bagian sebelum koma pertama)
    function extractShortLocation(fullText) {
        return fullText.split(',')[0].trim();
    }

    // Load Memori HP
    if(localStorage.getItem('al_mukhtar_loc_short')) {
        locText.innerText = localStorage.getItem('al_mukhtar_loc_short');
    }

    function toggleLocModal(show) {
        locModal.classList.toggle('show', show);
        locBack.classList.toggle('show', show);
        if(show) {
            history.pushState({ modal: true }, "");
        } else {
            inputLoc.value = ""; listLoc.innerHTML = ""; btnClearLoc.style.display = "none"; btnSaveLoc.disabled = true;
        }
    }

    btnLoc.onclick = (e) => { e.stopPropagation(); toggleLocModal(true); };
    locBack.onclick = () => { history.back(); };

    // GPS Tracker
    document.getElementById('gps-detect-btn').onclick = () => {
        if(!navigator.geolocation) return tampilNotif("Error", "GPS tidak didukung di perangkat ini", "error", "#dc2626");
        listLoc.innerHTML = '<li class="no-match-item">Mencari satelit GPS...</li>';
        navigator.geolocation.getCurrentPosition(pos => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`)
            .then(res => res.json()).then(data => {
                listLoc.innerHTML = "";
                if(data && data.address) {
                    const desa = data.address.village || data.address.town || data.address.city || "Lokasi Anda";
                    const full = `${desa}, ${data.address.state || ''}`;
                    let li = document.createElement('li');
                    li.className = 'suggestion-item';
                    li.innerHTML = `<span class="material-icons-outlined geo-mark">my_location</span> <span>${full}</span>`;
                    li.onclick = () => { 
                        inputLoc.value = full; 
                        shortLocation = extractShortLocation(full);
                        btnSaveLoc.disabled = false; 
                    };
                    listLoc.appendChild(li);
                }
            });
        }, () => listLoc.innerHTML = '<li class="no-match-item">Izin GPS ditolak.</li>');
    };

    // Pencarian Manual
    inputLoc.oninput = function() {
        btnClearLoc.style.display = this.value.length > 0 ? "block" : "none";
        if(this.value.length < 3) return;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.value}&countrycodes=id&limit=5`)
        .then(res => res.json()).then(data => {
            listLoc.innerHTML = "";
            data.forEach(item => {
                let li = document.createElement('li');
                li.className = 'suggestion-item';
                li.innerHTML = `<span class="material-icons-outlined geo-mark">location_on</span> <span>${item.display_name}</span>`;
                li.onclick = () => { 
                    inputLoc.value = item.display_name; 
                    shortLocation = extractShortLocation(item.display_name); // Potong nama
                    btnSaveLoc.disabled = false; 
                };
                listLoc.appendChild(li);
            });
        });
    };

    btnClearLoc.onclick = () => { inputLoc.value = ""; listLoc.innerHTML = ""; btnClearLoc.style.display = "none"; btnSaveLoc.disabled = true; };

    btnSaveLoc.onclick = () => {
        // Hanya simpan nama pendek (kata sebelum koma pertama)
        localStorage.setItem('al_mukhtar_loc_short', shortLocation);
        locText.innerText = shortLocation;
        history.back();
        setTimeout(() => tampilNotif("Berhasil", `Lokasi disetel ke ${shortLocation}`), 300);
    };

    // HISTORY BACK HANDLER
    window.addEventListener('popstate', () => {
        if(popProfile.classList.contains('show')) toggleProfile(false);
        if(locModal.classList.contains('show')) toggleLocModal(false);
    });

    // MENU & REFRESH
    document.getElementById('refresh-button').onclick = () => {
        document.getElementById('refresh-icon').classList.add('spin-animation');
        setTimeout(() => location.reload(), 500);
    };
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.onclick = () => tampilNotif("Fitur Terkunci", `Modul ${item.getAttribute('data-menu')} sedang dipersiapkan.`, "bookmark_border", "#ea580c");
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = function() {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        };
    });
});