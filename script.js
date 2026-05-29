/* ==========================================================================
   GLOBAL UTILITIES & HELPERS
   ========================================================================== */
function getBulanIndo(namaBulanEn) { const s = namaBulanEn.toLowerCase(); if (s.includes('muharram')) return "Muharram"; if (s.includes('safar')) return "Safar"; if (s.includes('rabi') && (s.includes('awwal') || s.includes('1'))) return "Rabiul Awal"; if (s.includes('rabi') && (s.includes('akhir') || s.includes('2'))) return "Rabiul Akhir"; if (s.includes('jumada') && (s.includes('ula') || s.includes('awwal') || s.includes('1'))) return "Jumadil Ula"; if (s.includes('jumada') && (s.includes('akhir') || s.includes('thani') || s.includes('2'))) return "Jumadil Akhir"; if (s.includes('rajab')) return "Rajab"; if (s.includes('sha')) return "Syaban"; if (s.includes('ramadan')) return "Ramadhan"; if (s.includes('shawwal')) return "Syawal"; if (s.includes('qi') || s.includes('qa')) return "Dzulqa'dah"; if (s.includes('hijjah')) return "Dzulhijjah"; return namaBulanEn; }
function toArDigits(n) { const id = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩']; return n.toString().split('').map(d => id[d]).join(''); }
function getPasaran(date) { const pasaran = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"]; let idx = (Math.floor((date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 3) % 5; return pasaran[idx < 0 ? idx + 5 : idx]; }

/* ==========================================================================
   DATABASE AWAL (DIAMBIL DARI database.json)
   ========================================================================== */
let menuData = {};
let dataDoaMadasa = [];
let dataPanduanSholat = [];

async function loadAppDatabase() {
    try {
        const response = await fetch('database.json?v=' + new Date().getTime());
        const db = await response.json();
        localStorage.setItem('al_mukhtar_db_offline', JSON.stringify(db));
        menuData = db.menuData || {};
        dataDoaMadasa = db.dataDoaMadasa || [];
        dataPanduanSholat = db.dataPanduanSholat || [];
    } catch (error) {
        console.log("Koneksi terputus! Mengambil menu dari memori HP...");
        const cachedDb = localStorage.getItem('al_mukhtar_db_offline');
        if (cachedDb) {
            const db = JSON.parse(cachedDb);
            menuData = db.menuData || {};
            dataDoaMadasa = db.dataDoaMadasa || [];
            dataPanduanSholat = db.dataPanduanSholat || [];
        } else {
            console.error("Belum ada data offline yang tersimpan.");
        }
    }
}

/* ==========================================================================
   SISTEM ZOOM FONT (HANYA MUNCUL DI HALAMAN BACAAN JSON)
   ========================================================================== */
let currentFontScale = parseFloat(localStorage.getItem('al_mukhtar_font_scale')) || 1;

function applyFontScale() { 
    document.documentElement.style.setProperty('--font-scale', currentFontScale); 
}

window.toggleFontSize = function() {
    if (currentFontScale === 1) currentFontScale = 1.25;
    else if (currentFontScale === 1.25) currentFontScale = 1.5;
    else currentFontScale = 1;
    
    localStorage.setItem('al_mukhtar_font_scale', currentFontScale);
    applyFontScale();
    
    let status = currentFontScale === 1 ? "Normal" : (currentFontScale === 1.25 ? "Besar" : "Sangat Besar");
    showToast("Ukuran Teks: " + status, "info");
}

function checkZoomBtnVisibility() {
    const btn = document.getElementById('global-zoom-btn');
    if(!btn) return;
    
    let isReadingMode = false;
    
    if (document.getElementById('quran-modal')?.classList.contains('modal-show') && currentQuranView === 'detail') isReadingMode = true;
    else if (document.getElementById('doa-modal')?.classList.contains('modal-show') && currentDoaView === 'detail') isReadingMode = true;
    else if (document.getElementById('panduan-sholat-modal')?.classList.contains('modal-show') && currentPanduanSholatView === 'detail') isReadingMode = true;
    else if (document.getElementById('app-modal')?.classList.contains('modal-show') && currentAppMenuView === 'detail') isReadingMode = true;

    if(isReadingMode) { 
        btn.style.display = 'flex'; 
        void btn.offsetWidth; 
        btn.classList.add('show'); 
    } else { 
        btn.classList.remove('show'); 
        setTimeout(() => { if(!btn.classList.contains('show')) btn.style.display = 'none'; }, 350); 
    }
}

/* ==========================================================================
   GLOBAL HISTORY ROUTING (SINKRONISASI TOMBOL BACK ANDROID 100%)
   ========================================================================== */
let isPopping = false;
let currentSchedule = null;
let dashboardInterval = null;
const notifAudio = new Audio('audio/notif.mp3'); 
let exitTimer = null; 
let toastTimeout = null; 

if (!window.location.hash || window.location.hash === '') {
    history.replaceState({ page: 'home' }, '', '#beranda');
}

function resetNavToBeranda() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => n.classList.remove('active'));
    let beranda = Array.from(navItems).find(n => n.innerText.toLowerCase().includes('beranda') || n.innerHTML.includes('fa-home') || n.getAttribute('href') === '#beranda');
    if (beranda) beranda.classList.add('active');
    else if (navItems.length > 0) navItems[0].classList.add('active');
}

// MESIN ROUTING BACK BUTTON UTAMA
window.addEventListener('popstate', function(event) {
    isPopping = true;

    if (exitTimer) { clearTimeout(exitTimer); exitTimer = null; }

    // 1. Lapisan Paling Atas: Alert/Notifikasi
    const alertBackdrop = document.getElementById('custom-alert-backdrop');
    if (alertBackdrop && alertBackdrop.classList.contains('show')) {
        alertBackdrop.classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    // 2. Lapisan Kedua: Popup Tafsir Quran
    const tafsirModal = document.getElementById('tafsir-modal');
    if (tafsirModal && tafsirModal.style.display !== 'none') {
        closeTafsir();
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    // 3. Lapisan Ketiga: Popup Profil
    const popProfile = document.getElementById('popup-box');
    if (popProfile && popProfile.classList.contains('show')) {
        popProfile.classList.remove('show');
        document.getElementById('popup-backdrop').classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    // 4. Lapisan Keempat: Sheet Lokasi Bawah
    const locModal = document.getElementById('location-sheet');
    if (locModal && locModal.classList.contains('show')) {
        locModal.classList.remove('show');
        document.getElementById('location-backdrop').classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    // 5. Lapisan Kelima: Modal Menu (Al-Quran, Doa, Kalender, Sholat)
    if (document.getElementById('quran-modal')?.classList.contains('modal-show')) { goBackQuran(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('doa-modal')?.classList.contains('modal-show')) { goBackDoa(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('panduan-sholat-modal')?.classList.contains('modal-show')) { goBackPanduanSholat(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('calendar-modal')?.classList.contains('modal-show')) { toggleCalendar(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('sholat-modal')?.classList.contains('modal-show')) { goBackSholat(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('app-modal')?.classList.contains('modal-show')) { goBackAppMenu(); isPopping = false; checkZoomBtnVisibility(); return; }

    // 6. Lapisan Dasar: Beranda (Konfirmasi Keluar)
    if (!exitTimer) {
        showToast("Tekan sekali lagi untuk keluar", "info");
        history.pushState({ page: 'exit_trap' }, '', '#exit');
        exitTimer = setTimeout(() => { exitTimer = null; }, 2000);
    } else {
        if (typeof Android !== 'undefined' && Android.exitApp) { Android.exitApp(); } 
        else { history.go(-100); }
    }
    
    isPopping = false;
    checkZoomBtnVisibility();
});

function closeAllModals() {
    ['quran-modal', 'doa-modal', 'panduan-sholat-modal', 'calendar-modal', 'sholat-modal', 'app-modal'].forEach(id => {
        const m = document.getElementById(id); if (m) m.classList.remove('modal-show');
    });
    stopAudio(); 
    resetNavToBeranda();
    checkZoomBtnVisibility();
}

function playNotif() { notifAudio.currentTime = 0; notifAudio.play().catch(e => {}); }

function showToast(msg, type = 'info') { 
    const t = document.getElementById('app-toast'); 
    if(!t) return;
    t.className = `modern-toast ${type}`;
    let icon = '<i class="fa-solid fa-bell text-white"></i>'; 
    if(type === 'success') icon = '<i class="fa-solid fa-check-circle text-white"></i>';
    if(type === 'error') icon = '<i class="fa-solid fa-times-circle text-white"></i>';
    if(msg.toLowerCase().includes("keluar")) icon = '<i class="fa-solid fa-arrow-right-from-bracket text-red-400"></i>';
    
    t.innerHTML = `${icon} <span>${msg}</span>`; 
    t.classList.remove('show');
    void t.offsetWidth; 
    t.classList.add('show'); 
    if(toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { t.classList.remove('show'); }, 2500); 
}

window.handleAlarm = function(btn, name) {
    const active = btn.classList.toggle('alarm-active');
    if(active) { playNotif(); showToast("Alarm " + name + " Aktif", "success"); localStorage.setItem('alarm_'+name, 'true'); }
    else { showToast("Alarm Dimatikan", "info"); localStorage.removeItem('alarm_'+name); }
}

document.addEventListener("DOMContentLoaded", async function () {
    
    await loadAppDatabase();

    document.addEventListener('contextmenu', e => e.preventDefault()); document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('keydown', e => { if (e.ctrlKey && [67, 65, 85, 83].includes(e.keyCode)) { e.preventDefault(); return false; } });

    applyFontScale();
    const zoomBtn = document.createElement('button');
    zoomBtn.id = 'global-zoom-btn';
    zoomBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-plus"></i>';
    
    let isDragging = false;
    let dragStartX, dragStartY;
    let elemStartX, elemStartY;

    function dragStart(e) {
        if (e.type === "touchstart") { dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY; } 
        else { dragStartX = e.clientX; dragStartY = e.clientY; }
        
        const rect = zoomBtn.getBoundingClientRect();
        elemStartX = rect.left; elemStartY = rect.top;
        isDragging = false;
        zoomBtn.style.transition = 'none'; 
    }

    function drag(e) {
        if (dragStartX === undefined || dragStartY === undefined) return;
        let currentX, currentY;
        if (e.type === "touchmove") { currentX = e.touches[0].clientX; currentY = e.touches[0].clientY; } 
        else { currentX = e.clientX; currentY = e.clientY; }

        const diffX = currentX - dragStartX; const diffY = currentY - dragStartY;

        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
            isDragging = true;
            if (e.cancelable) e.preventDefault();

            let newLeft = elemStartX + diffX; let newTop = elemStartY + diffY;

            const maxX = window.innerWidth - zoomBtn.offsetWidth;
            const maxY = window.innerHeight - zoomBtn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            zoomBtn.style.left = newLeft + 'px';
            zoomBtn.style.top = newTop + 'px';
            zoomBtn.style.right = 'auto'; 
            zoomBtn.style.bottom = 'auto'; 
        }
    }

    function dragEnd() {
        dragStartX = undefined; dragStartY = undefined;
        zoomBtn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'; 
    }

    zoomBtn.addEventListener('touchstart', dragStart, {passive: false});
    document.addEventListener('touchmove', (e) => { if(dragStartX !== undefined) drag(e); }, {passive: false});
    document.addEventListener('touchend', dragEnd);

    zoomBtn.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', (e) => { if(dragStartX !== undefined) drag(e); });
    document.addEventListener('mouseup', dragEnd);

    zoomBtn.addEventListener('click', (e) => {
        if (isDragging) { e.preventDefault(); e.stopPropagation(); return; } 
        toggleFontSize();
    });

    document.body.appendChild(zoomBtn);

    const alertBackdrop = document.getElementById('custom-alert-backdrop');
    window.tampilNotif = function(judul, pesan, icon = "check_circle", color = "#007A78") {
        if (!isPopping && !alertBackdrop.classList.contains('show')) history.pushState({ modal: 'alert' }, '', '#alert');
        document.getElementById('custom-alert-title').innerText = judul; document.getElementById('custom-alert-message').innerText = pesan;
        document.getElementById('custom-alert-icon').innerText = icon; document.querySelector('.alert-icon-circle').style.color = color;
        alertBackdrop.classList.add('show');
    };
    document.getElementById('alert-confirm-btn').onclick = () => {
        if (!isPopping) { history.back(); return; }
        alertBackdrop.classList.remove('show');
    };

    const btnLoc = document.getElementById('location-button'); const locText = document.getElementById('location-text');
    const locModal = document.getElementById('location-sheet'); const locBack = document.getElementById('location-backdrop');
    const inputLoc = document.getElementById('location-search-input'); const listLoc = document.getElementById('suggestion-list');
    const btnSaveLoc = document.getElementById('save-location-btn'); 
    
    let shortLocation = ""; function extractShortLocation(fullText) { return fullText.split(',')[0].trim(); }
    if(localStorage.getItem('al_mukhtar_loc_short')) { locText.innerText = localStorage.getItem('al_mukhtar_loc_short'); }

    function toggleLocModal(show) { if (show && !isPopping) history.pushState({ modal: 'location' }, '', '#lokasi'); locModal.classList.toggle('show', show); locBack.classList.toggle('show', show); }
    btnLoc.onclick = (e) => { e.stopPropagation(); toggleLocModal(true); }; locBack.onclick = () => { if(!isPopping) history.back(); else toggleLocModal(false); };

    document.getElementById('gps-detect-btn').onclick = () => {
        if(!navigator.geolocation) return tampilNotif("Error", "GPS tidak didukung", "error", "#dc2626");
        listLoc.innerHTML = '<li class="no-match-item">Mencari satelit GPS...</li>';
        navigator.geolocation.getCurrentPosition(pos => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`)
            .then(res => res.json()).then(data => {
                listLoc.innerHTML = "";
                if(data && data.address) {
                    const full = `${data.address.village || data.address.town || data.address.city || "Lokasi Anda"}, ${data.address.state || ''}`;
                    let li = document.createElement('li'); li.className = 'suggestion-item';
                    li.innerHTML = `<span class="material-icons-outlined geo-mark">my_location</span> <span>${full}</span>`;
                    li.onclick = () => { inputLoc.value = full; shortLocation = extractShortLocation(full); btnSaveLoc.disabled = false; };
                    listLoc.appendChild(li);
                }
            });
        }, () => listLoc.innerHTML = '<li class="no-match-item">Izin GPS ditolak.</li>');
    };

   inputLoc.oninput = function() {
        if(this.value.length > 0) btnSaveLoc.disabled = false; else btnSaveLoc.disabled = true;
        if(this.value.length < 3) return;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.value}&countrycodes=id&limit=5`)
        .then(res => res.json())
        .then(data => {
            listLoc.innerHTML = ""; 
            data.forEach(item => {
                let li = document.createElement('li'); li.className = 'suggestion-item';
                li.innerHTML = `<span class="material-icons-outlined geo-mark">location_on</span> <span>${item.display_name}</span>`;
                li.onclick = () => { inputLoc.value = item.display_name; shortLocation = extractShortLocation(item.display_name); btnSaveLoc.disabled = false; };
                listLoc.appendChild(li);
            });
        });
    };
    
    btnSaveLoc.onclick = () => { 
        localStorage.setItem('al_mukhtar_loc_short', shortLocation); 
        localStorage.removeItem('last_prayer_data'); 
        localStorage.removeItem('last_prayer_date');
        locText.innerText = shortLocation; 
        if(!isPopping) history.back(); else toggleLocModal(false); 
        setTimeout(() => { showToast(`Lokasi disetel ke ${shortLocation}`, "success"); initDashboardJadwal(); }, 300); 
    };

    const popProfile = document.getElementById('popup-box'); const popBackdrop = document.getElementById('popup-backdrop');
    function toggleProfile(show) { if (show && !isPopping) history.pushState({ modal: 'profile' }, '', '#profil'); popProfile.classList.toggle('show', show); popBackdrop.classList.toggle('show', show); }
    document.getElementById('info-button').onclick = (e) => { e.stopPropagation(); toggleProfile(!popProfile.classList.contains('show')); };
    document.getElementById('close-profile-btn').onclick = () => { if(!isPopping) history.back(); else toggleProfile(false); }; popBackdrop.onclick = () => { if(!isPopping) history.back(); else toggleProfile(false); };

    document.getElementById('refresh-button').onclick = async () => { 
        const icon = document.getElementById('refresh-icon');
        if (icon.classList.contains('spin-animation')) return; 
        icon.classList.add('spin-animation'); 
        showToast("Menyinkronkan data dari server...", "info");
        
        localStorage.clear();
        sessionStorage.clear();

        try {
            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(cacheKeys.map(key => caches.delete(key)));
            }
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) await reg.unregister();
            }
        } catch (e) {}

        const cleanUrl = window.location.href.split('?')[0].split('#')[0];
        try {
            await fetch(cleanUrl, { cache: 'reload', headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
        } catch (e) {}

        setTimeout(() => { window.location.replace(cleanUrl + "?v=" + Date.now()); }, 500); 
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if(this.tagName.toLowerCase() === 'a' && this.getAttribute('href') === '#beranda') {
                e.preventDefault(); history.replaceState({ page: 'home' }, '', '#beranda'); closeAllModals();
            }
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); 
            this.classList.add('active');
        });
    });

    setInterval(() => {
        if (!currentSchedule) return;
        const now = new Date();
        const cur = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        for (const [n, t] of Object.entries(currentSchedule)) {
            if (localStorage.getItem('alarm_' + n) && cur === t) { playNotif(); showToast("WAKTUNYA " + n.toUpperCase(), "success"); }
        }
    }, 60000);

    /* ==========================================================================
       AUTO DETEKSI LOKASI SAAT PERTAMA KALI DIBUKA
       ========================================================================== */
    if (!localStorage.getItem('al_mukhtar_loc_short')) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.address) {
                        const full = `${data.address.village || data.address.town || data.address.city || "Lokasi Anda"}, ${data.address.state || ''}`;
                        let shortLoc = full.split(',')[0].trim();
                        
                        localStorage.setItem('al_mukhtar_loc_short', shortLoc);
                        localStorage.removeItem('last_prayer_data'); 
                        localStorage.removeItem('last_prayer_date');
                        
                        const locTextEl = document.getElementById('location-text');
                        if (locTextEl) locTextEl.innerText = shortLoc;
                        
                        showToast(`Lokasi otomatis disetel: ${shortLoc}`, "success");
                        initDashboardJadwal();
                    } else {
                        initDashboardJadwal();
                    }
                }).catch(() => initDashboardJadwal());
            }, () => {
                initDashboardJadwal();
            });
        } else {
            initDashboardJadwal();
        }
    } else {
        initDashboardJadwal();
    }
});

/* ==========================================================================
   MESIN JADWAL BERANDA (LIVE COUNTDOWN)
   ========================================================================== */
async function initDashboardJadwal() {
    try {
        const locName = localStorage.getItem('al_mukhtar_loc_short') || localStorage.getItem('last_location') || 'Bangkalan';
        const cachedPrayer = localStorage.getItem('last_prayer_data');
        const todayStr = new Date().toLocaleDateString('en-GB');
        const cachedDate = localStorage.getItem('last_prayer_date');
        let t, h, readableDate;

        if (cachedPrayer && cachedDate === todayStr) {
            const d = JSON.parse(cachedPrayer); t = d.timings; h = d.date.hijri; readableDate = d.date.readable;
        } else {
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${locName}&country=Indonesia&method=11`);
            const d = await res.json();
            t = d.data.timings; h = d.data.date.hijri; readableDate = d.data.date.readable;
            localStorage.setItem('last_prayer_data', JSON.stringify(d.data));
            localStorage.setItem('last_prayer_date', todayStr);
        }

        currentSchedule = { Subuh: t.Fajr, Dzuhur: t.Dhuhr, Ashar: t.Asr, Maghrib: t.Maghrib, Isya: t.Isha };

        const elHijri = document.getElementById('java-hijri'); const elDate = document.getElementById('full-date');
        if(elHijri) elHijri.innerText = `${h.day} ${getBulanIndo(h.month.en)} ${h.year} H`;
        
        if(elDate) {
            const ms = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const dsIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const now = new Date();
            elDate.innerText = `${dsIndo[now.getDay()]} ${getPasaran(now)}, ${now.getDate()} ${ms[now.getMonth()]} ${now.getFullYear()} M`.toUpperCase();
        }

        if(dashboardInterval) clearInterval(dashboardInterval);
        dashboardInterval = setInterval(() => renderCountdown(t), 1000);
        renderCountdown(t); 

    } catch (e) { console.log("Gagal memuat jadwal beranda", e); }
}

function renderCountdown(timings) {
    const now = new Date();
    const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    const schedule = [ { name: 'SUBUH', time: timings.Fajr }, { name: 'TERBIT', time: timings.Sunrise }, { name: 'DZUHUR', time: timings.Dhuhr }, { name: 'ASHAR', time: timings.Asr }, { name: 'MAGHRIB', time: timings.Maghrib }, { name: 'ISYA', time: timings.Isha } ];
    let nextPrayer = null; let nextPrayerMs = 0;
    for (let i = 0; i < schedule.length; i++) {
        const [h, m] = schedule[i].time.split(':').map(Number);
        const pMs = h * 3600000 + m * 60000;
        if (pMs > currentMs) { nextPrayer = schedule[i]; nextPrayerMs = pMs; break; }
    }
    if (!nextPrayer) {
        nextPrayer = schedule[0]; const [h, m] = nextPrayer.time.split(':').map(Number);
        nextPrayerMs = (h + 24) * 3600000 + m * 60000; 
    }
    const diff = nextPrayerMs - currentMs;
    const s = Math.floor((diff / 1000) % 60); const m = Math.floor((diff / 1000 / 60) % 60); const h = Math.floor((diff / 1000 / 60 / 60));
    const pNameEl = document.getElementById('prayer-name'); const pTimeEl = document.getElementById('prayer-time'); const pCountEl = document.getElementById('countdown');
    if(pNameEl) pNameEl.innerText = nextPrayer.name;
    if(pTimeEl) pTimeEl.innerText = nextPrayer.time;
    if(pCountEl) pCountEl.innerText = `-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ==========================================================================
   MODUL JADWAL SHOLAT (MODAL JADWAL FULL)
   ========================================================================== */
window.toggleSholat = function() {
    const el = document.getElementById('sholat-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals();
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'sholat_jadwal' }, '', '#jadwalsholat'); else history.pushState({ modal: 'sholat_jadwal' }, '', '#jadwalsholat'); }
        el.classList.add('modal-show'); renderSholatContent();
    } else { goBackSholat(); }
}

window.goBackSholat = function() {
    if (!isPopping) { history.back(); return; }
    document.getElementById('sholat-modal').classList.remove('modal-show');
    resetNavToBeranda();
}

window.handleJadwalScroll = function(el) { document.getElementById('sholat-sticky-header').classList.toggle('doa-header-slim', el.scrollTop > 50); }

async function renderSholatContent() {
    const content = document.getElementById('sholat-content');
    content.innerHTML = `<div class="text-center py-20 text-teal-600 font-bold text-[10px] animate-pulse uppercase">SINKRONISASI WAKTU...</div>`;
    try {
        const locName = localStorage.getItem('al_mukhtar_loc_short') || localStorage.getItem('last_location') || 'Bangkalan';
        const cachedPrayer = localStorage.getItem('last_prayer_data'); let t, h, readableDate;
        if (cachedPrayer) {
            const d = JSON.parse(cachedPrayer); t = d.timings; h = d.date.hijri; readableDate = d.date.readable;
        } else {
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${locName}&country=Indonesia&method=11`);
            const d = await res.json(); t = d.data.timings; h = d.data.date.hijri; readableDate = d.data.date.readable;
        }
        currentSchedule = { Subuh: t.Fajr, Dzuhur: t.Dhuhr, Ashar: t.Asr, Maghrib: t.Maghrib, Isya: t.Isha };
        
        let html = `<div class="bg-teal-600 py-3 px-5 rounded-[24px] text-white mb-6 shadow-xl text-center">
            <h2 id="live-clock" class="text-3xl font-bold mb-0.5">${new Date().toLocaleTimeString('id-ID')}</h2>
            <p class="text-[11px] text-teal-200 font-medium mb-2 tracking-wide uppercase truncate max-w-[200px] mx-auto"><i class="fa-solid fa-location-dot mr-1"></i> ${locName}</p>
            <div class="flex justify-between text-[9px] font-medium border-t border-white/10 pt-2.5 uppercase"><span>${h.day} ${getBulanIndo(h.month.en)} ${h.year} H</span><span>${readableDate}</span></div>
        </div>`;
            
        const schedule = [ {n:'Imsak',t:t.Imsak,i:'fa-clock'}, {n:'Subuh',t:t.Fajr,i:'fa-cloud-sun'}, {n:'Terbit',t:t.Sunrise,i:'fa-sun'}, {n:'Dzuhur',t:t.Dhuhr,i:'fa-sun'}, {n:'Ashar',t:t.Asr,i:'fa-cloud-sun-rain'}, {n:'Maghrib',t:t.Maghrib,i:'fa-moon'}, {n:'Isya',t:t.Isha,i:'fa-star'} ];

        html += schedule.map(s => `<div class="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-50 shadow-sm mb-3">
                <div class="flex items-center gap-4"><div class="w-11 h-11 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600"><i class="fa-solid ${s.i} text-base"></i></div><span class="text-xs font-black text-slate-700 uppercase tracking-tight">${s.n}</span></div>
                <div class="flex items-center gap-5"><span class="text-lg font-black text-slate-900 font-mono">${s.t}</span><button onclick="handleAlarm(this, '${s.n}')" class="text-slate-400 transition-all ${localStorage.getItem('alarm_'+s.n)?'alarm-active':''}"><i class="fa-solid fa-bell text-sm"></i></button></div>
            </div>`).join('');
        
        content.innerHTML = html;

        if(window.liveClockInterval) clearInterval(window.liveClockInterval);
        window.liveClockInterval = setInterval(() => { const c = document.getElementById('live-clock'); if(c) c.innerText = new Date().toLocaleTimeString('id-ID'); }, 1000);
    } catch (e) { content.innerHTML = `<p class="text-center p-10 text-red-500 font-bold text-xs uppercase">Koneksi Gagal</p>`; }
}

/* ==========================================================================
   MESIN 5 MENU GRID LAINNYA 
   ========================================================================== */
let currentAppMenuCat = ''; let currentAppMenuView = 'list'; let currentParentFolderId = null; 

function handleAppScroll(el) { document.getElementById('app-sticky-header').classList.toggle('doa-header-slim', el.scrollTop > 50); }

window.openAppMenu = function(cat) {
    const el = document.getElementById('app-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals();
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'appMenu', cat: cat }, '', '#' + cat); else history.pushState({ modal: 'appMenu', cat: cat }, '', '#' + cat); }
        el.classList.add('modal-show'); currentParentFolderId = null; loadAppMenuList(cat);
        checkZoomBtnVisibility();
    }
}

window.goBackAppMenu = function() {
    if (!isPopping) { history.back(); return; }
    if (currentAppMenuView === 'detail') { loadAppMenuList(currentAppMenuCat); } 
    else { document.getElementById('app-modal').classList.remove('modal-show'); resetNavToBeranda(); }
    checkZoomBtnVisibility();
}

function loadAppMenuList(cat) {
    currentAppMenuCat = cat; currentAppMenuView = 'list'; const data = menuData[cat]; if(!data) return;
    document.getElementById('app-modal-title').innerText = data.title; document.getElementById('app-nav-controls').innerHTML = ''; 
    let html = '';
    data.items.forEach((item, i) => {
        if (item.subItems) {
            const isOpened = (item.id === currentParentFolderId);
            const wrapperClass = isOpened ? "submenu-wrapper overflow-hidden transition-all duration-300 bg-slate-50/50 rounded-b-2xl border-x border-b border-slate-200/60 mt-1" : "submenu-wrapper max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/50 rounded-b-2xl border-x border-b border-transparent";
            const arrowClass = isOpened ? "fa-solid fa-chevron-down text-teal-600 text-[10px] transition-transform duration-300 arrow-icon rotate-180" : "fa-solid fa-chevron-down text-teal-600 text-[10px] transition-transform duration-300 arrow-icon";
            const maxH = isOpened ? 'style="max-height: 2000px;"' : '';
            html += `<div class="submenu-container mb-3"><div onclick="toggleAppAccordion(this, ${item.id})" class="doa-item-card !mb-0"><div class="doa-number">${i+1}</div><span class="doa-title-text">${item.title}</span><i class="${arrowClass}"></i></div><div class="${wrapperClass}" ${maxH}><div class="p-2 space-y-2">`;
            item.subItems.forEach((subItem, j) => {
                html += `<div onclick="loadAppMenuDetail('${cat}', ${subItem.id}, ${item.id})" class="doa-item-card !bg-white !mb-0 last:mb-0"><div class="doa-number !bg-teal-50/60 !text-teal-600 !border-teal-100">${i+1}.${j+1}</div><span class="doa-title-text">${subItem.title}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`;
            });
            html += `</div></div></div>`;
        } else {
            html += `<div onclick="loadAppMenuDetail('${cat}', ${item.id}, null)" class="doa-item-card"><div class="doa-number">${i+1}</div><span class="doa-title-text">${item.title}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`;
        }
    });
    document.getElementById('app-modal-content').innerHTML = html;
    checkZoomBtnVisibility();
}

window.toggleAppAccordion = function(element, folderId) {
    const wrapper = element.parentElement.querySelector('.submenu-wrapper'); const arrow = element.querySelector('.arrow-icon'); const isOpen = !wrapper.classList.contains('max-h-0');
    document.querySelectorAll('.submenu-container').forEach(sub => {
        const otherWrapper = sub.querySelector('.submenu-wrapper'); const otherArrow = sub.querySelector('.arrow-icon');
        if (otherWrapper) { otherWrapper.style.maxHeight = '0px'; otherWrapper.classList.add('max-h-0'); otherWrapper.classList.remove('border-slate-200/60', 'mt-1'); }
        if (otherArrow) { otherArrow.classList.remove('rotate-180'); }
    });
    if (!isOpen) { wrapper.classList.remove('max-h-0'); wrapper.classList.add('border-slate-200/60', 'mt-1'); wrapper.style.maxHeight = wrapper.scrollHeight + 'px'; arrow.classList.add('rotate-180'); currentParentFolderId = folderId; } 
    else { currentParentFolderId = null; }
}

window.loadAppMenuDetail = function(cat, id, parentFolderId = null) {
    if (!isPopping) history.pushState({ modal: 'appMenu', cat: cat, detail: true }, '', '#' + cat + '-detail');
    currentAppMenuView = 'detail'; currentParentFolderId = parentFolderId; renderAppMenuDetailLogic(cat, id, parentFolderId);
    checkZoomBtnVisibility();
}

window.toggleMenuTerjemahan = function() {
    const c = document.getElementById('menu-terjemahan-container'); const btn = document.getElementById('btn-toggle-menu-terjemahan');
    if (c.style.display === 'none') { c.style.display = 'block'; btn.innerHTML = '<i class="fa-solid fa-eye-slash mr-1"></i> Sembunyikan Detail'; } 
    else { c.style.display = 'none'; btn.innerHTML = '<i class="fa-solid fa-eye mr-1"></i> Tampilkan Detail'; }
}

async function renderAppMenuDetailLogic(cat, id, parentFolderId) {
    let activeArray = [];
    if (parentFolderId !== null) { const folder = menuData[cat].items.find(x => x.id === parentFolderId); activeArray = folder.subItems; } 
    else { activeArray = menuData[cat].items.filter(x => !x.subItems); }
    const currentIndex = activeArray.findIndex(x => x.id === id); const info = activeArray[currentIndex];
    if(!info) return;

    const content = document.getElementById('app-modal-content'); 
    document.getElementById('app-modal-title').innerText = info.title;
    
    let navHtml = '';
    if (currentIndex > 0) navHtml += `<button onclick="loadAppMenuDetail('${cat}', ${activeArray[currentIndex - 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-left"></i></button>`;
    if (currentIndex < activeArray.length - 1) navHtml += `<button onclick="loadAppMenuDetail('${cat}', ${activeArray[currentIndex + 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-right"></i></button>`;
    document.getElementById('app-nav-controls').innerHTML = navHtml;

    content.innerHTML = `<div class="text-center py-20 text-teal-600 font-bold text-[10px] animate-pulse uppercase">Mengambil Berkah...</div>`;
    
    try {
        const res = await fetch(info.path); const d = await res.json();
        let teksLatin = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; let teksArti = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : "";
        let kontenTambahan = ""; 
        if (teksLatin) kontenTambahan += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${teksLatin}</p>`; 
        if (teksArti) kontenTambahan += `<p class="translation-read-text text-slate-500 italic text-justify px-2">"${teksArti}"</p>`;
        
        const tampilanDetail = (teksLatin || teksArti) ? `<div class="mt-4 text-center mb-6"><button onclick="toggleMenuTerjemahan()" id="btn-toggle-menu-terjemahan" class="text-[10px] font-bold text-teal-700 uppercase tracking-wide bg-teal-50 border border-teal-100 py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-transform"><i class="fa-solid fa-eye mr-1"></i> Tampilkan Detail</button></div><div id="menu-terjemahan-container" style="display: none;"><div class="w-16 h-1 bg-teal-50 mx-auto mb-6 rounded-full"></div>${kontenTambahan}</div>` : "";
        
        let teksArab = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || "");
        teksArab = teksArab.replace(/([٠-٩]+)/g, '<span class="ayah-end-number">۝$1</span>');

        let headerCard = d.judul ? `<div class="text-center mb-6"><h3 class="font-kufi text-2xl text-teal-700 font-bold bg-teal-50/50 inline-block px-5 py-2 rounded-xl border border-teal-100" dir="rtl">${d.judul}</h3></div><div class="w-full h-[1px] bg-slate-100 mb-8"></div>` : '';

        content.innerHTML = `<div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">${headerCard}<p class="font-arab text-justify" dir="rtl">${teksArab}</p>${tampilanDetail}</div>`;
    } catch (error) { content.innerHTML = `<div class="text-center py-20"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-red-500 font-bold text-xs uppercase">Gagal Memuat Data</p></div>`; }
}

/* ==========================================================================
   MESIN KALENDER PREMIUM
   ========================================================================== */
let currentCalDate = new Date(); let currentHijriData = []; const holidayCache = {}; const DATABASE_SKB = {};
function extractDynamicHolidays(apiData) { const dynamic = {}; if (Array.isArray(apiData)) { apiData.forEach(h => { const name = (h.localName + " " + h.name).toLowerCase(); dynamic[h.date] = { name: h.localName || h.name, type: (name.includes('cuti bersama') || name.includes('joint holiday')) ? 'cuti' : 'holiday' }; }); } return dynamic; }
async function getHolidayAPI(year) { const cacheKey = `holiday_api_${year}`; if (holidayCache[year]) return holidayCache[year]; const localCache = localStorage.getItem(cacheKey); if (localCache) { holidayCache[year] = JSON.parse(localCache); return holidayCache[year]; } try { const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`); const data = await res.json(); holidayCache[year] = data; localStorage.setItem(cacheKey, JSON.stringify(data)); return data; } catch (e) { return []; } }

async function fetchFullCalendarData() {
    const y = currentCalDate.getFullYear(); const m = currentCalDate.getMonth() + 1; const grid = document.getElementById('calendar-days-grid'); const cacheKey = `hijri_${m}_${y}`;
    grid.innerHTML = `<div class="col-span-7 text-center py-20 text-teal-600 font-bold text-[10px] animate-pulse uppercase">Memuat Kalender...</div>`;
    try { const cached = localStorage.getItem(cacheKey); if (cached) { currentHijriData = JSON.parse(cached); await renderCalendar(); return; } const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${m}/${y}`); const json = await res.json(); if (json && json.data) { currentHijriData = json.data; localStorage.setItem(cacheKey, JSON.stringify(json.data)); await renderCalendar(); } } catch (e) { const cached = localStorage.getItem(cacheKey); if (cached) { currentHijriData = JSON.parse(cached); await renderCalendar(); } else { grid.innerHTML = `<div class="col-span-7 text-center py-10 text-red-400 font-bold text-xs uppercase">Offline</div>`; } }
}

async function renderCalendar() {
    const grid = document.getElementById('calendar-days-grid'); const holEl = document.getElementById('holiday-list'); grid.innerHTML = ''; holEl.innerHTML = '';
    const y = currentCalDate.getFullYear(); const m = currentCalDate.getMonth(); const realToday = new Date(); const ms = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]; const dsIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    document.getElementById('calendar-month-name').innerText = `${ms[m]} ${y}`;
    const activeDay = (y === realToday.getFullYear() && m === realToday.getMonth()) ? realToday.getDate() : 1; const hInfo = currentHijriData[activeDay - 1];
    if (hInfo) { document.getElementById('hijri-detail-header').innerText = `${hInfo.hijri.day} ${getBulanIndo(hInfo.hijri.month.en)} ${hInfo.hijri.year} H`; document.getElementById('masehi-detail-header').innerText = `${dsIndo[new Date(y, m, activeDay).getDay()]} ${getPasaran(new Date(y, m, activeDay))}, ${activeDay} ${ms[m]} ${y} M`; }
    const startDay = new Date(y, m, 1).getDay(); for (let i = 0; i < startDay; i++) { grid.innerHTML += '<div class="calendar-date empty-date"></div>'; }
    const rawApiHolidays = await getHolidayAPI(y); const dynamicHolidaysMap = extractDynamicHolidays(rawApiHolidays);
    for (const [index, day] of currentHijriData.entries()) {
        const d = index + 1; const dtObj = new Date(y, m, d); const dtKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hDay = parseInt(day.hijri.day); const hMonth = day.hijri.month.number; const gMonth = m + 1; const gDay = d; const isSunday = dtObj.getDay() === 0; let namaLibur = null; let isCutiBersama = false;
        if (DATABASE_SKB[dtKey]) { namaLibur = DATABASE_SKB[dtKey]; isCutiBersama = true; }
        if (!namaLibur) { if (gMonth === 1 && gDay === 1) namaLibur = 'Tahun Baru Masehi'; else if (gMonth === 5 && gDay === 1) namaLibur = 'Hari Buruh Internasional'; else if (gMonth === 6 && gDay === 1) namaLibur = 'Hari Lahir Pancasila'; else if (gMonth === 8 && gDay === 17) namaLibur = 'Hari Kemerdekaan RI'; else if (gMonth === 12 && gDay === 25) namaLibur = 'Hari Raya Natal'; }
        if (!namaLibur) { if (hDay === 1 && hMonth === 1) namaLibur = 'Tahun Baru Islam'; else if (hDay === 12 && hMonth === 3) namaLibur = 'Maulid Nabi Muhammad SAW'; else if (hDay === 27 && hMonth === 7) namaLibur = 'Isra Mi’raj'; else if ((hDay === 1 || hDay === 2) && hMonth === 10) namaLibur = 'Hari Raya Idul Fitri'; else if (hDay === 10 && hMonth === 12) namaLibur = 'Hari Raya Idul Adha'; }
        if (!namaLibur && dynamicHolidaysMap[dtKey]) { namaLibur = dynamicHolidaysMap[dtKey].name; if (dynamicHolidaysMap[dtKey].type === 'cuti') isCutiBersama = true; }
        let dateColorClass = ''; if (isSunday || (namaLibur && !isCutiBersama)) dateColorClass = 'is-real-holiday'; else if (isCutiBersama) dateColorClass = 'is-cuti-bersama';
        const isToday = realToday.toDateString() === dtObj.toDateString();
        grid.innerHTML += `<div class="calendar-date ${isToday ? 'date-today' : ''} ${dateColorClass}"><span class="date-masehi">${d}</span><span class="date-hijri">${toArDigits(day.hijri.day)}</span><span class="date-pasaran">${getPasaran(dtObj)}</span></div>`;
        if (namaLibur) { holEl.innerHTML += `<div class="${isCutiBersama ? 'cuti-card' : 'holiday-card'}"><div class="flex-1"><p class="text-[12px] font-bold text-slate-800">${d} ${ms[m]} - ${namaLibur}</p></div></div>`; }
    }
}
window.changeMonth = function(v) { currentCalDate.setMonth(currentCalDate.getMonth() + v); fetchFullCalendarData(); }

window.toggleCalendar = function() {
    const el = document.getElementById('calendar-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals(); 
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'calendar' }, '', '#kalender'); else history.pushState({ modal: 'calendar' }, '', '#kalender'); }
        el.classList.add('modal-show'); fetchFullCalendarData();
    } else {
        if (!isPopping) { history.back(); return; } 
        el.classList.remove('modal-show'); resetNavToBeranda();
    }
}


/* ==========================================================================
   AL-QURAN PRO (EQURAN.ID V2 API) & NAMA JUZ BAHASA ARAB
   ========================================================================== */
const quranBaseUrl = 'https://equran.id/api/v2';
let currentQuranTab = 'surah';
let currentQuranView = 'list';
let currentSurahAudioFull = null;
let currentAudio = null;
let isTranslationVisible = true;
window.ayatData = {}; 
let quranBookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
window.currentlyPlayingAyatKey = null;

const quranJuzMapping = [
    { juz: 1, start: { s: 1, a: 1 }, end: { s: 2, a: 141 } },
    { juz: 2, start: { s: 2, a: 142 }, end: { s: 2, a: 252 } },
    { juz: 3, start: { s: 2, a: 253 }, end: { s: 3, a: 92 } },
    { juz: 4, start: { s: 3, a: 93 }, end: { s: 4, a: 23 } },
    { juz: 5, start: { s: 4, a: 24 }, end: { s: 4, a: 147 } },
    { juz: 6, start: { s: 4, a: 148 }, end: { s: 5, a: 81 } },
    { juz: 7, start: { s: 5, a: 82 }, end: { s: 6, a: 110 } },
    { juz: 8, start: { s: 6, a: 111 }, end: { s: 7, a: 87 } },
    { juz: 9, start: { s: 7, a: 88 }, end: { s: 8, a: 40 } },
    { juz: 10, start: { s: 8, a: 41 }, end: { s: 9, a: 92 } },
    { juz: 11, start: { s: 9, a: 93 }, end: { s: 11, a: 5 } },
    { juz: 12, start: { s: 11, a: 6 }, end: { s: 12, a: 52 } },
    { juz: 13, start: { s: 12, a: 53 }, end: { s: 14, a: 52 } },
    { juz: 14, start: { s: 15, a: 1 }, end: { s: 16, a: 128 } },
    { juz: 15, start: { s: 17, a: 1 }, end: { s: 18, a: 74 } },
    { juz: 16, start: { s: 18, a: 75 }, end: { s: 20, a: 135 } },
    { juz: 17, start: { s: 21, a: 1 }, end: { s: 22, a: 78 } },
    { juz: 18, start: { s: 23, a: 1 }, end: { s: 25, a: 20 } },
    { juz: 19, start: { s: 25, a: 21 }, end: { s: 27, a: 55 } },
    { juz: 20, start: { s: 27, a: 56 }, end: { s: 29, a: 45 } },
    { juz: 21, start: { s: 29, a: 46 }, end: { s: 33, a: 30 } },
    { juz: 22, start: { s: 33, a: 31 }, end: { s: 36, a: 27 } },
    { juz: 23, start: { s: 36, a: 28 }, end: { s: 39, a: 31 } },
    { juz: 24, start: { s: 39, a: 32 }, end: { s: 41, a: 46 } },
    { juz: 25, start: { s: 41, a: 47 }, end: { s: 45, a: 37 } },
    { juz: 26, start: { s: 46, a: 1 }, end: { s: 51, a: 30 } },
    { juz: 27, start: { s: 51, a: 31 }, end: { s: 57, a: 29 } },
    { juz: 28, start: { s: 58, a: 1 }, end: { s: 66, a: 12 } },
    { juz: 29, start: { s: 67, a: 1 }, end: { s: 77, a: 50 } },
    { juz: 30, start: { s: 78, a: 1 }, end: { s: 114, a: 6 } }
];

const namaJuzArab = [
    "الجزء الأول", "الجزء الثاني", "الجزء الثالث", "الجزء الرابع", "الجزء الخامس",
    "الجزء السادس", "الجزء السابع", "الجزء الثامن", "الجزء التاسع", "الجزء العاشر",
    "الجزء الحادي عشر", "الجزء الثاني عشر", "الجزء الثالث عشر", "الجزء الرابع عشر", "الجزء الخامس عشر",
    "الجزء السادس عشر", "الجزء السابع عشر", "الجزء الثامن عشر", "الجزء التاسع عشر", "الجزء العشرون",
    "الجزء الحادي والعشرون", "الجزء الثاني والعشرون", "الجزء الثالث والعشرون", "الجزء الرابع والعشرون", "الجزء الخامس والعشرون",
    "الجزء السادس والعشرون", "الجزء السابع والعشرون", "الجزء الثامن والعشرون", "الجزء التاسع والعشرون", "الجزء الثلاثون"
];

window.handleQuranScroll = function(el) { 
    const isScrolled = el.scrollTop > 50;
    document.getElementById('quran-sticky-header').classList.toggle('header-slim', isScrolled); 
}

window.toggleQuran = function() {
    const el = document.getElementById('quran-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals(); 
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'quran' }, '', '#quran'); else history.pushState({ modal: 'quran' }, '', '#quran'); }
        el.classList.add('modal-show'); 
        currentQuranView = 'list'; 
        switchQuranTab('surah');
        checkZoomBtnVisibility();
    } else { goBackQuran(); }
}

window.goBackQuran = function() {
    if (!isPopping) { history.back(); return; }
    if (currentQuranView === 'detail') {
        currentQuranView = 'list'; 
        document.getElementById('surah-title-arab').innerText = ''; 
        document.getElementById('surah-title-latin').innerText = ''; 
        document.getElementById('surah-subtitle').innerText = ''; 
        document.getElementById('quran-tabs').classList.remove('hidden'); 
        document.getElementById('surah-meta-info').classList.add('hidden'); 
        stopAudio(); 
        switchQuranTab(currentQuranTab); 
        document.getElementById('quran-content').scrollTo({ top: 0, behavior: 'smooth' });
    } else { 
        document.getElementById('quran-modal').classList.remove('modal-show'); 
        resetNavToBeranda(); 
        stopAudio(); 
    }
    checkZoomBtnVisibility();
}

window.switchQuranTab = function(tab) { 
    currentQuranTab = tab; 
    currentQuranView = 'list'; 
    checkZoomBtnVisibility(); 
    document.getElementById('quran-tabs').classList.remove('hidden'); 
    document.getElementById('tab-surah').classList.toggle('active', tab === 'surah'); 
    document.getElementById('tab-juz').classList.toggle('active', tab === 'juz'); 
    tab === 'surah' ? loadSurahList() : loadJuzList(); 
}

window.toggleTranslation = function() { 
    isTranslationVisible = !isTranslationVisible; 
    document.querySelectorAll('.translation-read-text').forEach(el => { 
        isTranslationVisible ? el.classList.remove('hidden') : el.classList.add('hidden'); 
    }); 
}

function stopAudio() { 
    if (currentAudio) { currentAudio.pause(); currentAudio = null; } 
    const perAudio = document.getElementById('per-ayat-audio');
    if(perAudio) {
        perAudio.pause();
        if (window.currentlyPlayingAyatKey) {
            const btn = document.getElementById(`play-btn-${window.currentlyPlayingAyatKey}`);
            if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            window.currentlyPlayingAyatKey = null;
        }
    }
}

async function loadSurahList() { 
    const c = document.getElementById('quran-content'); 
    document.getElementById('surah-title-arab').innerText = ""; 
    document.getElementById('surah-title-latin').innerText = ""; 
    document.getElementById('surah-subtitle').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 
    c.innerHTML = `<div class="text-center py-20 text-teal-600 animate-pulse font-bold">Memuat Surah...</div>`; 
    
    try { 
        const response = await fetch(`${quranBaseUrl}/surat`);
        const json = await response.json();
        let html = ''; 
        json.data.forEach(s => { 
            html += `<div onclick="loadDetailQuran(${s.nomor}, 'surah')" class="quran-item"><div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0"><span class="w-9 h-9 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">${s.nomor}</span><div class="truncate"><h4 class="font-bold text-[13px] text-slate-700 uppercase truncate">${s.namaLatin}</h4><p class="text-[8px] text-slate-500 font-semibold uppercase truncate">${s.arti}</p></div></div><div class="arab-side-wrapper"><div class="arab-box-number font-arab">${toArDigits(s.nomor)}</div><span class="font-arab text-xl text-teal-600" dir="rtl">${s.nama}</span></div></div>`; 
        }); 
        c.innerHTML = html; 
    } catch (e) { 
        c.innerHTML = '<div class="text-center py-20 text-red-500 font-bold">Error Memuat Data</div>'; 
    } 
    checkZoomBtnVisibility(); 
}

async function loadJuzList() { 
    const c = document.getElementById('quran-content'); 
    document.getElementById('surah-title-arab').innerText = ""; 
    document.getElementById('surah-title-latin').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 
    
    let html = ''; 
    for (let i = 1; i <= 30; i++) { 
        html += `<div onclick="loadDetailQuran(${i}, 'juz')" class="quran-item"><div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0"><span class="w-9 h-9 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">${i}</span><div class="truncate"><h4 class="font-bold text-[13px] text-slate-700 uppercase truncate">Juz ${i}</h4></div></div><div class="arab-side-wrapper"><div class="arab-box-number font-arab">${toArDigits(i)}</div><span class="font-arab text-[15px] text-teal-600" dir="rtl">${namaJuzArab[i-1]}</span></div></div>`; 
    } 
    c.innerHTML = html; 
    checkZoomBtnVisibility(); 
}

window.loadDetailQuran = async function(id, type) {
    if (!isPopping) history.pushState({ page: 'quran_detail' }, '', '#quran-detail');
    currentQuranView = 'detail'; 
    checkZoomBtnVisibility();
    
    const c = document.getElementById('quran-content'); 
    c.innerHTML = `<div class="text-center py-20 animate-spin text-3xl text-teal-600"><i class="fa-solid fa-circle-notch"></i></div>`; 
    c.scrollTop = 0; 
    document.getElementById('quran-sticky-header').classList.remove('header-slim'); 
    document.getElementById('quran-tabs').classList.add('hidden');
    window.ayatData = {};

    try {
        if (type === 'surah') {
            await renderSurah(id, c);
        } else {
            await renderJuz(id, c);
        }
    } catch (e) {
        c.innerHTML = '<p class="text-center p-10 font-bold text-red-400">Gagal memuat konten.</p>';
    }
}

async function renderSurah(nomorSurah, container) {
    const response = await fetch(`${quranBaseUrl}/surat/${nomorSurah}`);
    const json = await response.json();
    const surah = json.data;
    currentSurahAudioFull = surah.audioFull;

    document.getElementById('surah-title-arab').innerText = surah.nama; 
    document.getElementById('surah-title-latin').innerText = surah.namaLatin; 
    document.getElementById('surah-subtitle').innerText = `(${surah.arti})`; 
    document.getElementById('surah-info-count').innerText = `${surah.jumlahAyat} Ayat`; 
    document.getElementById('surah-info-type').innerText = surah.tempatTurun; 
    document.getElementById('surah-meta-info').classList.remove('hidden'); 

    let html = `
        <div class="qari-container">
            <label for="qari-select" style="font-size: 11px; font-weight: 700; color: #007A78; text-transform: uppercase;">Pilih Qari Audio:</label>
            <select id="qari-select" class="qari-select" onchange="changeQariQuran(this)">
                <option value="01">Abdullah Al-Juhany</option>
                <option value="02">Abdul Muhsin Al-Qasim</option>
                <option value="03">Abdurrahman as-Sudais</option>
                <option value="04">Ibrahim Al-Dossari</option>
                <option value="05" selected>Misyari Rasyid Al-Afasi</option>
            </select>
            <audio id="surah-audio-full" class="audio-player" controls>
                <source id="audio-source-full" src="${currentSurahAudioFull['05']}" type="audio/mpeg">
            </audio>
        </div>
        <div class="surah-separator" style="margin-top:0;">
    `;
    
    if (surah.nomor !== 1 && surah.nomor !== 9) {
        html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
    }
    html += `</div>`; 

    surah.ayat.forEach(ayat => {
        html += createAyatCardQuran(ayat, surah.nomor);
    });
    container.innerHTML = html;
}

async function renderJuz(nomorJuz, container) {
    document.getElementById('surah-title-arab').innerText = namaJuzArab[nomorJuz - 1]; 
    document.getElementById('surah-title-latin').innerText = `Juz ${nomorJuz}`; 
    document.getElementById('surah-subtitle').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 

    const juzInfo = quranJuzMapping[nomorJuz - 1];
    let fetchPromises = [];
    for (let s = juzInfo.start.s; s <= juzInfo.end.s; s++) {
        fetchPromises.push(fetch(`${quranBaseUrl}/surat/${s}`).then(r => r.json()));
    }
    const results = await Promise.all(fetchPromises);
    let html = '';

    results.forEach(res => {
        let surah = res.data;
        let ayats = surah.ayat;
        
        let mulaiAyat = 1;
        if (surah.nomor === juzInfo.start.s) {
            mulaiAyat = juzInfo.start.a;
            ayats = ayats.filter(a => a.nomorAyat >= mulaiAyat);
        }

        let akhirAyat = surah.jumlahAyat;
        if (surah.nomor === juzInfo.end.s) {
            akhirAyat = juzInfo.end.a;
            ayats = ayats.filter(a => a.nomorAyat <= akhirAyat);
        }

        if (ayats.length > 0) {
            if (mulaiAyat === 1) {
                html += `
                    <div class="surah-separator">
                        <div class="surah-frame">
                            <div class="surah-frame-inner">
                                <div class="surah-badge-gold">${surah.tempatTurun}</div>
                                <div class="surah-arabic-name">${surah.nama}</div>
                                <div class="surah-badge-gold">${surah.jumlahAyat} Ayat</div>
                            </div>
                        </div>
                `;
                if (surah.nomor !== 1 && surah.nomor !== 9) {
                    html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
                }
                html += `</div>`;
            } else {
                html += `
                    <div class="juz-continue-header">
                        Melanjutkan Surah ${surah.namaLatin} (Ayat ${mulaiAyat})
                    </div>
                `;
            }

            ayats.forEach(ayat => {
                html += createAyatCardQuran(ayat, surah.nomor);
            });
        }
    });
    container.innerHTML = html;
}

function createAyatCardQuran(ayat, nomorSurah) {
    const uniqueKey = `${nomorSurah}_${ayat.nomorAyat}`;
    window.ayatData[uniqueKey] = ayat;
    const isBookmarked = quranBookmarks.includes(uniqueKey) ? 'bookmark-active' : '';
    const hiddenClass = isTranslationVisible ? '' : 'hidden';

    let playIcon = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    if (window.currentlyPlayingAyatKey === uniqueKey && !document.getElementById('per-ayat-audio').paused) {
        playIcon = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    }

    return `
        <div class="ayat-card">
            <div class="action-bar">
                <div class="ayah-number-circle bg-teal-50 text-teal-600 font-bold flex items-center justify-center rounded-full shrink-0 border border-teal-100">${ayat.nomorAyat}</div>
                
                <button id="play-btn-${uniqueKey}" class="action-btn play-btn" onclick="playAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')">
                    ${playIcon}
                </button>
                
                <button id="bm-btn-${uniqueKey}" class="action-btn ${isBookmarked}" onclick="bookmarkAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
                
                <button class="action-btn" onclick="showTafsirQuran('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                </button>
                
                <button class="action-btn" onclick="copyAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                
                <button class="action-btn" onclick="shareAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
            </div>
            
            <div class="ayat-arabic">${ayat.teksArab.replace(/ࣖ/g, '<span style="font-family: \'Arial\', sans-serif; font-size: 0.55em; color: #007A78; position: relative; bottom: 0.6em; margin-right: 5px;"> ؏ </span>')}</div>
            <div class="translation-read-text text-slate-500 italic leading-relaxed text-justify ${hiddenClass}">${ayat.teksIndonesia}</div>
        </div>
    `;
}

window.changeQariQuran = function(selectElement) {
    const audioPlayer = document.getElementById('surah-audio-full');
    const audioSource = document.getElementById('audio-source-full');
    const isPlaying = !audioPlayer.paused && !audioPlayer.ended && audioPlayer.readyState > 2;

    audioSource.src = currentSurahAudioFull[selectElement.value];
    audioPlayer.load(); 
    if (isPlaying) audioPlayer.play();
}

window.playAyatQuran = function(nomorSurah, nomorAyat) {
    const uniqueKey = `${nomorSurah}_${nomorAyat}`;
    const ayat = window.ayatData[uniqueKey];
    const audioEl = document.getElementById('per-ayat-audio');
    
    if (!audioEl.dataset.listenerAttached) {
        audioEl.addEventListener('play', () => {
            if (window.currentlyPlayingAyatKey) {
                const btn = document.getElementById(`play-btn-${window.currentlyPlayingAyatKey}`);
                if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
            }
        });
        audioEl.addEventListener('pause', () => {
            if (window.currentlyPlayingAyatKey) {
                const btn = document.getElementById(`play-btn-${window.currentlyPlayingAyatKey}`);
                if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            }
        });
        audioEl.addEventListener('ended', () => {
            if (window.currentlyPlayingAyatKey) {
                const btn = document.getElementById(`play-btn-${window.currentlyPlayingAyatKey}`);
                if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            }
            window.currentlyPlayingAyatKey = null;
        });
        audioEl.dataset.listenerAttached = 'true';
    }

    if (window.currentlyPlayingAyatKey === uniqueKey) {
        if (audioEl.paused) {
            audioEl.play().catch(e => showToast("Gagal memutar ayat.", "error"));
        } else {
            audioEl.pause();
        }
        return;
    }

    if (window.currentlyPlayingAyatKey) {
        const prevBtn = document.getElementById(`play-btn-${window.currentlyPlayingAyatKey}`);
        if (prevBtn) prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }

    let qariKey = '05'; 
    const qariSelect = document.getElementById('qari-select');
    if (qariSelect && currentQuranTab === 'surah') qariKey = qariSelect.value;

    const mainAudio = document.getElementById('surah-audio-full');
    if(mainAudio) mainAudio.pause();

    audioEl.src = ayat.audio[qariKey];
    window.currentlyPlayingAyatKey = uniqueKey;
    audioEl.play().catch(e => showToast("Gagal memutar ayat.", "error"));
}

window.copyAyatQuran = function(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    const textToCopy = `${ayat.teksArab}\n\n${ayat.teksIndonesia}\n(QS. ${nomorSurah}:${nomorAyat})`;
    navigator.clipboard.writeText(textToCopy).then(() => showToast(`Ayat ke-${nomorAyat} disalin!`, 'success'));
}

window.shareAyatQuran = function(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    if (navigator.share) {
        navigator.share({ title: `QS. ${nomorSurah}:${nomorAyat}`, text: `${ayat.teksArab}\n\n${ayat.teksIndonesia}` }).catch(console.error);
    } else {
        showToast('Fitur Share belum didukung.', 'info');
    }
}

window.bookmarkAyatQuran = function(nomorSurah, nomorAyat) {
    const uniqueKey = `${nomorSurah}_${nomorAyat}`;
    const btnElement = document.getElementById(`bm-btn-${uniqueKey}`);
    const index = quranBookmarks.indexOf(uniqueKey);

    if (index > -1) {
        quranBookmarks.splice(index, 1);
        btnElement.classList.remove('bookmark-active');
        showToast(`Dihapus dari Penanda`, 'info');
    } else {
        quranBookmarks.push(uniqueKey);
        btnElement.classList.add('bookmark-active');
        showToast(`Berhasil ditandai!`, 'success');
    }
    localStorage.setItem('quranBookmarks', JSON.stringify(quranBookmarks));
}

window.showTafsirQuran = async function(nomorSurah, nomorAyat) {
    if (!isPopping) history.pushState({ modal: 'tafsir' }, '', '#tafsir');
    const modal = document.getElementById('tafsir-modal');
    document.getElementById('tafsir-title').innerText = `Tafsir QS. ${nomorSurah}:${nomorAyat}`;
    const bodyText = document.getElementById('tafsir-body');
    
    modal.style.display = 'flex';
    setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'translateY(0)'; }, 10);
    bodyText.innerHTML = '<div class="text-center py-20 text-teal-600 font-bold text-[10px] animate-pulse uppercase">Mengambil Tafsir...</div>';
    
    try {
        const response = await fetch(`${quranBaseUrl}/tafsir/${nomorSurah}`);
        const json = await response.json();
        const dataTafsir = json.data.tafsir.find(t => t.ayat == nomorAyat);
        
        if (dataTafsir) {
            let textRaw = dataTafsir.teks.replace(/(\d+)\.([a-zA-Z])/g, '$1. $2').replace(/(^|\n)([a-z])\.([a-zA-Z])/g, '$1$2. $3');
            bodyText.innerHTML = textRaw.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom:12px;">${p.trim()}</p>`).join('');
        } else {
            bodyText.innerHTML = '<p>Data tafsir tidak ditemukan.</p>';
        }
    } catch (error) {
        bodyText.innerHTML = '<p style="color:red; text-align:center;">Gagal terhubung ke server Tafsir.</p>';
    }
}

window.closeTafsir = function() {
    if (!isPopping) { history.back(); return; }
    const modal = document.getElementById('tafsir-modal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

document.getElementById('tafsir-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        if(!isPopping) history.back(); else closeTafsir();
    }
});

/* ==========================================================================
   DATA & MESIN DOA (MIX: DENGAN & TANPA SUB-MENU)
   ========================================================================== */
let currentDoaView = 'list';
let currentDoaParentFolderId = null;

function handleDoaScroll(el) { document.getElementById('doa-sticky-header').classList.toggle('doa-header-slim', el.scrollTop > 50); }

window.toggleDoaAccordion = function(element, folderId) {
    const wrapper = element.parentElement.querySelector('.submenu-wrapper'); 
    const arrow = element.querySelector('.arrow-icon'); 
    const isOpen = !wrapper.classList.contains('max-h-0');
    
    document.querySelectorAll('#doa-content .submenu-container').forEach(sub => {
        const otherWrapper = sub.querySelector('.submenu-wrapper'); 
        const otherArrow = sub.querySelector('.arrow-icon');
        if (otherWrapper) { otherWrapper.style.maxHeight = '0px'; otherWrapper.classList.add('max-h-0'); otherWrapper.classList.remove('border-slate-200/60', 'mt-1'); }
        if (otherArrow) { otherArrow.classList.remove('rotate-180'); }
    });
    
    if (!isOpen) { 
        wrapper.classList.remove('max-h-0'); wrapper.classList.add('border-slate-200/60', 'mt-1'); wrapper.style.maxHeight = wrapper.scrollHeight + 'px'; arrow.classList.add('rotate-180'); currentDoaParentFolderId = folderId; 
    } else { 
        currentDoaParentFolderId = null; 
    }
}

function toggleDoa() {
    const el = document.getElementById('doa-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals(); 
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'doa' }, '', '#doa'); else history.pushState({ modal: 'doa' }, '', '#doa'); }
        el.classList.add('modal-show'); 
        currentDoaParentFolderId = null;
        loadDoaList();
        checkZoomBtnVisibility();
    } else { goBackDoa(); }
}

function goBackDoa() {
    if (!isPopping) { history.back(); return; }
    if (currentDoaView === 'detail') { currentDoaView = 'list'; loadDoaList(); document.getElementById('doa-content').scrollTo({ top: 0, behavior: 'smooth' }); } 
    else { document.getElementById('doa-modal').classList.remove('modal-show'); resetNavToBeranda(); }
    checkZoomBtnVisibility();
}

function loadDoaList() { 
    currentDoaView = 'list'; 
    const c = document.getElementById('doa-content'); 
    document.getElementById('doa-header-title').innerText = "KUMPULAN DOA"; 
    document.getElementById('doa-nav-controls').innerHTML = ''; 
    c.scrollTop = 0; 
    document.getElementById('doa-sticky-header').classList.remove('doa-header-slim'); 
    
    let html = '';
    dataDoaMadasa.forEach((d, i) => {
        if (d.subItems) {
            const isOpened = (d.id === currentDoaParentFolderId);
            const wrapperClass = isOpened ? "submenu-wrapper overflow-hidden transition-all duration-300 bg-slate-50/50 rounded-b-2xl border-x border-b border-slate-200/60 mt-1" : "submenu-wrapper max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/50 rounded-b-2xl border-x border-b border-transparent";
            const arrowClass = isOpened ? "fa-solid fa-chevron-down text-teal-600 text-[10px] transition-transform duration-300 arrow-icon rotate-180" : "fa-solid fa-chevron-down text-teal-600 text-[10px] transition-transform duration-300 arrow-icon";
            const maxH = isOpened ? 'style="max-height: 2000px;"' : '';
            
            html += `<div class="submenu-container mb-3">
                        <div onclick="toggleDoaAccordion(this, ${d.id})" class="doa-item-card !mb-0">
                            <div class="doa-number">${i+1}</div>
                            <span class="doa-title-text">${d.judul}</span>
                            <i class="${arrowClass}"></i>
                        </div>
                        <div class="${wrapperClass}" ${maxH}>
                            <div class="p-2 space-y-2">`;
            d.subItems.forEach((subItem, j) => {
                html += `<div onclick="loadDoaDetail(${subItem.id}, ${d.id})" class="doa-item-card !bg-white !mb-0 last:mb-0">
                            <div class="doa-number !bg-teal-50/60 !text-teal-600 !border-teal-100">${i+1}.${j+1}</div>
                            <span class="doa-title-text">${subItem.judul}</span>
                            <i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i>
                         </div>`;
            });
            html += `       </div>
                        </div>
                     </div>`;
        } 
        else {
            html += `<div onclick="loadDoaDetail(${d.id})" class="doa-item-card">
                        <div class="doa-number">${i+1}</div>
                        <span class="doa-title-text">${d.judul}</span>
                        <i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i>
                     </div>`;
        }
    });
    c.innerHTML = html;
    
    checkZoomBtnVisibility(); 
}

function loadDoaDetail(id, parentFolderId = null) { 
    if (!isPopping) history.pushState({ page: 'doa_detail' }, '', '#doa-detail'); 
    currentDoaView = 'detail'; 
    renderDoaDetailLogic(id, parentFolderId); 
    checkZoomBtnVisibility(); 
}

window.toggleTerjemahanMulti = function(btn, targetId) { 
    const c = document.getElementById(targetId); 
    if (c.style.display === 'none') { 
        c.style.display = 'block'; 
        btn.innerHTML = '<i class="fa-solid fa-eye-slash mr-1"></i> Sembunyikan Terjemahan'; 
    } else { 
        c.style.display = 'none'; 
        btn.innerHTML = '<i class="fa-solid fa-eye mr-1"></i> Tampilkan Terjemahan'; 
    } 
}

async function renderDoaDetailLogic(id, parentFolderId = null) {
    let activeArray = [];
    if (parentFolderId !== null) { 
        const folder = dataDoaMadasa.find(x => x.id === parentFolderId); 
        activeArray = folder.subItems; 
    } else { 
        activeArray = dataDoaMadasa.filter(x => !x.subItems); 
    }
    
    const c = document.getElementById('doa-content'); 
    const idx = activeArray.findIndex(i => i.id === id); 
    const info = activeArray[idx]; 
    if(!info) return;
    
    document.getElementById('doa-header-title').innerText = info.judul; 
    c.scrollTop = 0; 
    document.getElementById('doa-sticky-header').classList.remove('doa-header-slim');
    
    let navHtml = ''; 
    if (idx > 0) navHtml += `<button onclick="loadDoaDetail(${activeArray[idx - 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-left"></i></button>`; 
    if (idx < activeArray.length - 1) navHtml += `<button onclick="loadDoaDetail(${activeArray[idx + 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-right"></i></button>`; 
    document.getElementById('doa-nav-controls').innerHTML = navHtml;
    
    c.innerHTML = `<div class="text-center py-20 animate-pulse text-teal-600 font-bold text-[10px] uppercase">Mengambil Berkah...</div>`;
    try { 
        const res = await fetch(info.path); 
        const d = await res.json(); 
        let finalHtml = "";

        if (d.kumpulan && Array.isArray(d.kumpulan)) {
            d.kumpulan.forEach((item, index) => {
                let tLat = item.latin ? (Array.isArray(item.latin) ? item.latin.join('<br><br>') : item.latin) : ""; 
                let tArt = item.arti ? (Array.isArray(item.arti) ? item.arti.join('<br><br>') : item.arti) : ""; 
                
                let kt = ""; 
                if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
                if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
                
                const tDet = kt ? `<div class="mt-2 text-center mb-4"><button onclick="toggleTerjemahanMulti(this, 'doa-terj-${index}')" class="text-[10px] font-bold text-teal-700 uppercase tracking-wide bg-teal-50 border border-teal-100 py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-transform"><i class="fa-solid fa-eye mr-1"></i> Tampilkan Terjemahan</button></div><div id="doa-terj-${index}" style="display: none;"><div class="w-12 h-1 bg-teal-50 mx-auto mb-6 rounded-full"></div>${kt}</div>` : ""; 
                
                let tAr = Array.isArray(item.arab) ? item.arab.join(' ') : (item.arab || ""); 
                tAr = tAr.replace(/([٠-٩]+)/g, '<span class="ayah-end-number font-arab text-teal-600">۝$1</span>');

                let headerCard = item.judul ? `<h3 class="font-kufi text-lg text-teal-700 mb-4 font-bold bg-teal-50/50 inline-block px-4 py-1.5 rounded-xl border border-teal-100">${item.judul}</h3>` : `<h3 class="font-arab text-xl text-teal-600 mb-4 leading-none">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3>`;

                finalHtml += `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100 mb-6">${headerCard}<div class="w-full h-[1px] bg-slate-100 mb-8"></div><p class="font-arab mb-8 text-justify" dir="rtl">${tAr}</p>${tDet}</div>`; 
            });
        } 
        else {
            let tLat = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; 
            let tArt = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : ""; 
            
            let kt = ""; 
            if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
            if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
            
            const tDet = kt ? `<div class="mt-2 text-center mb-4"><button onclick="toggleTerjemahanMulti(this, 'doa-terj-single')" class="text-[10px] font-bold text-teal-700 uppercase tracking-wide bg-teal-50 border border-teal-100 py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-transform"><i class="fa-solid fa-eye mr-1"></i> Tampilkan Terjemahan</button></div><div id="doa-terj-single" style="display: none;"><div class="w-12 h-1 bg-teal-50 mx-auto mb-6 rounded-full"></div>${kt}</div>` : ""; 
            
            let tAr = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || ""); 
            tAr = tAr.replace(/([٠-٩]+)/g, '<span class="ayah-end-number font-arab text-teal-600">۝$1</span>');

            let headerCard = d.judul ? `<h3 class="font-kufi text-lg text-teal-700 mb-4 font-bold bg-teal-50/50 inline-block px-4 py-1.5 rounded-xl border border-teal-100">${d.judul}</h3>` : `<h3 class="font-arab text-xl text-teal-600 mb-4 leading-none">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3>`;

            finalHtml = `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100 mb-6">${headerCard}<div class="w-full h-[1px] bg-slate-100 mb-8"></div><p class="font-arab mb-8 text-justify" dir="rtl">${tAr}</p>${tDet}</div>`; 
        }

        c.innerHTML = finalHtml;
    } catch (e) { 
        c.innerHTML = `<div class="text-center p-10"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-xs text-red-500 font-bold uppercase">Gagal memuat doa</p></div>`; 
    }
}

/* ==========================================================================
   DATA & MESIN PANDUAN SHOLAT
   ========================================================================== */
let currentPanduanSholatView = 'list';
function handlePanduanSholatScroll(el) { document.getElementById('panduan-sholat-sticky-header').classList.toggle('panduan-sholat-header-slim', el.scrollTop > 50); }

function togglePanduanSholat() {
    const el = document.getElementById('panduan-sholat-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals(); 
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'sholat_panduan' }, '', '#panduansholat'); else history.pushState({ modal: 'sholat_panduan' }, '', '#panduansholat'); }
        el.classList.add('modal-show'); loadPanduanSholatList();
        checkZoomBtnVisibility();
    } else { goBackPanduanSholat(); }
}

function goBackPanduanSholat() {
    if (!isPopping) { history.back(); return; }
    if (currentPanduanSholatView === 'detail') { currentPanduanSholatView = 'list'; loadPanduanSholatList(); document.getElementById('panduan-sholat-content').scrollTo({ top: 0, behavior: 'smooth' }); } 
    else { document.getElementById('panduan-sholat-modal').classList.remove('modal-show'); resetNavToBeranda(); }
    checkZoomBtnVisibility();
}

function loadPanduanSholatList() { currentPanduanSholatView = 'list'; const c = document.getElementById('panduan-sholat-content'); document.getElementById('panduan-sholat-header-title').innerText = "PANDUAN SHOLAT"; document.getElementById('panduan-sholat-nav-controls').innerHTML = ''; c.scrollTop = 0; document.getElementById('panduan-sholat-sticky-header').classList.remove('panduan-sholat-header-slim'); c.innerHTML = dataPanduanSholat.map((d, index) => `<div onclick="loadPanduanSholatDetail(${d.id})" class="panduan-sholat-item-card"><div class="panduan-sholat-number">${index + 1}</div><span class="panduan-sholat-title-text">${d.judul}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`).join(''); checkZoomBtnVisibility(); }

function loadPanduanSholatDetail(id) { if (!isPopping) history.pushState({ page: 'sholat_detail' }, '', '#sholat-detail'); currentPanduanSholatView = 'detail'; renderPanduanSholatDetailLogic(id); checkZoomBtnVisibility(); }

window.toggleTerjemahanPanduanSholat = function() { const c = document.getElementById('panduan-sholat-terjemahan-container'); const b = document.getElementById('btn-toggle-terjemahan-panduan-sholat'); if (c.style.display === 'none') { c.style.display = 'block'; b.innerHTML = '<i class="fa-solid fa-eye-slash mr-1"></i> Sembunyikan Terjemahan'; } else { c.style.display = 'none'; b.innerHTML = '<i class="fa-solid fa-eye mr-1"></i> Tampilkan Terjemahan'; } }

async function renderPanduanSholatDetailLogic(id) {
    const c = document.getElementById('panduan-sholat-content'); const idx = dataPanduanSholat.findIndex(i => i.id === id); const info = dataPanduanSholat[idx]; document.getElementById('panduan-sholat-header-title').innerText = info.judul; c.scrollTop = 0; document.getElementById('panduan-sholat-sticky-header').classList.remove('panduan-sholat-header-slim');
    let navHtml = ''; if (idx > 0) navHtml += `<button onclick="loadPanduanSholatDetail(${dataPanduanSholat[idx - 1].id})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-left"></i></button>`; if (idx < dataPanduanSholat.length - 1) navHtml += `<button onclick="loadPanduanSholatDetail(${dataPanduanSholat[idx + 1].id})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-right"></i></button>`; document.getElementById('panduan-sholat-nav-controls').innerHTML = navHtml;
    c.innerHTML = `<div class="text-center py-20 animate-pulse text-teal-600 font-bold text-[10px] uppercase">Mengambil Panduan...</div>`;
    try { const res = await fetch(info.path); const d = await res.json(); 
        let tLat = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; let tArt = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : ""; 
        
        let kt = ""; 
        if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
        if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
        
        const tDet = kt ? `<div class="mt-2 text-center mb-4"><button onclick="toggleTerjemahanPanduanSholat()" id="btn-toggle-terjemahan-panduan-sholat" class="text-[10px] font-bold text-teal-700 uppercase tracking-wide bg-teal-50 border border-teal-100 py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-transform"><i class="fa-solid fa-eye mr-1"></i> Tampilkan Terjemahan</button></div><div id="panduan-sholat-terjemahan-container" style="display: none;"><div class="w-12 h-1 bg-teal-50 mx-auto mb-6 rounded-full"></div>${kt}</div>` : ""; 
        
        let tAr = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || "");
        tAr = tAr.replace(/([٠-٩]+)/g, '<span class="ayah-end-number">۝$1</span>');

        c.innerHTML = `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100"><h3 class="font-arab text-xl text-teal-600 mb-4 leading-none">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3><div class="w-full h-[1px] bg-slate-100 mb-8"></div><p class="font-arab mb-8 text-justify" dir="rtl">${tAr}</p>${tDet}</div>`; 
    } catch (e) { c.innerHTML = `<div class="text-center p-10"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-xs text-red-500 font-bold uppercase">Gagal memuat panduan</p></div>`; }
}

/* ==========================================================================
   PWA INSTALL PROMPT
   ========================================================================== */
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Cegah mini-infobar bawaan Chrome agar tidak muncul
    e.preventDefault();
    // Simpan event sehingga bisa dipicu nanti
    deferredPrompt = e;
    
    // Cek apakah user pernah menutup banner ini sebelumnya
    if (localStorage.getItem('al_mukhtar_pwa_closed') !== 'true') {
        // Tampilkan banner dengan jeda 2 detik agar lebih halus
        setTimeout(() => {
            if(installBanner) {
                installBanner.style.display = 'flex';
                void installBanner.offsetWidth; // Trigger reflow
                installBanner.classList.add('show');
            }
        }, 2000);
    }
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Tampilkan native prompt instalasi
            deferredPrompt.prompt();
            // Tunggu pilihan user
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User mengizinkan instalasi PWA');
            }
            // Kosongkan prompt yang tertunda
            deferredPrompt = null;
            // Sembunyikan banner kita
            installBanner.classList.remove('show');
            setTimeout(() => { installBanner.style.display = 'none'; }, 500);
        }
    });
}

if(closeBtn) {
    closeBtn.addEventListener('click', () => {
        installBanner.classList.remove('show');
        setTimeout(() => { installBanner.style.display = 'none'; }, 500);
        // Simpan ke memory HP agar tidak mengganggu lagi
        localStorage.setItem('al_mukhtar_pwa_closed', 'true');
    });
}

// Beri ucapan sukses jika berhasil terinstall
window.addEventListener('appinstalled', () => {
    if(installBanner) {
        installBanner.classList.remove('show');
        setTimeout(() => { installBanner.style.display = 'none'; }, 500);
    }
    showToast("Aplikasi berhasil diinstal!", "success");
});