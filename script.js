/* ==========================================================================
   GLOBAL UTILITIES & HELPERS
   ========================================================================== */
   
const APP_DATA_VERSION = "1.0";
window.ramCache = {}; // Wadah memori agar halaman tidak loading dua kali

// MASTER LOADING ANIMATION (ISLAMIC MODERN)
window.getLoadingHtml = function(teks = "MENGAMBIL BERKAH...") {
    return `
    <div class="text-center py-24 px-8 flex flex-col items-center justify-center gap-4">
        <div class="text-teal-600/80 text-4xl animate-bounce">
            <i class="fa-solid fa-book-quran"></i>
        </div>
        <span class="text-[10px] font-bold text-teal-600 uppercase tracking-[0.2em] animate-pulse">${teks}</span>
    </div>
    `;
};

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
    else if (document.getElementById('fiqih-modal')?.classList.contains('modal-show') && currentFiqihView === 'detail') isReadingMode = true;
    // KODE BARU: Tombol Zoom (Kaca Pembesar) AKTIF di menu Tanya AI
    else if (document.getElementById('ai-modal')?.classList.contains('modal-show')) isReadingMode = true;

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

    const alertBackdrop = document.getElementById('custom-alert-backdrop');
    if (alertBackdrop && alertBackdrop.classList.contains('show')) {
        alertBackdrop.classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    const tafsirModal = document.getElementById('tafsir-modal');
    if (tafsirModal && tafsirModal.style.display !== 'none') {
        closeTafsir();
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    const popProfile = document.getElementById('popup-box');
    if (popProfile && popProfile.classList.contains('show')) {
        popProfile.classList.remove('show');
        document.getElementById('popup-backdrop').classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    const locModal = document.getElementById('location-sheet');
    if (locModal && locModal.classList.contains('show')) {
        locModal.classList.remove('show');
        document.getElementById('location-backdrop').classList.remove('show');
        isPopping = false; checkZoomBtnVisibility(); return;
    }

    // --- PASTIKAN SEMUA PENGECEKAN MODAL ADA DI SINI ---
    if (document.getElementById('quran-modal')?.classList.contains('modal-show')) { goBackQuran(); isPopping = false; checkZoomBtnVisibility(); return; }
    
    // KODE YANG SUDAH DIPERBARUI: Mengganti Fiqih menjadi AI
    if (document.getElementById('ai-modal')?.classList.contains('modal-show')) { goBackAi(); isPopping = false; checkZoomBtnVisibility(); return; } 
    
    if (document.getElementById('doa-modal')?.classList.contains('modal-show')) { goBackDoa(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('panduan-sholat-modal')?.classList.contains('modal-show')) { goBackPanduanSholat(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('calendar-modal')?.classList.contains('modal-show')) { toggleCalendar(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('sholat-modal')?.classList.contains('modal-show')) { goBackSholat(); isPopping = false; checkZoomBtnVisibility(); return; }
    if (document.getElementById('app-modal')?.classList.contains('modal-show')) { goBackAppMenu(); isPopping = false; checkZoomBtnVisibility(); return; }

    // --- BLOK KELUAR APLIKASI HARUS ADA DI PALING BAWAH ---
    if (typeof Android !== 'undefined' && Android.exitApp) { 
        Android.exitApp(); 
    } else if (navigator.app && navigator.app.exitApp) {
        navigator.app.exitApp();
    } else {
        window.close();
    }
    
    isPopping = false;
    checkZoomBtnVisibility();
});

function closeAllModals() {
    ['quran-modal', 'doa-modal', 'panduan-sholat-modal', 'calendar-modal', 'sholat-modal', 'app-modal', 'fiqih-modal', 'ai-modal'].forEach(id => {
        const m = document.getElementById(id); if (m) m.classList.remove('modal-show');
    });
    stopAudio(); 
    resetNavToBeranda();
    checkZoomBtnVisibility();
    
    // KODE BARU: Jaga-jaga agar menu navigasi selalu muncul di beranda
    const bNav = document.querySelector('.bottom-nav');
    if(bNav) bNav.style.display = 'flex';
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
	tampilkanQuoteAcak();

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
	
    document.querySelectorAll('.menu-item, .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof tampilkanQuoteAcak === 'function') {
                setTimeout(tampilkanQuoteAcak, 150);
            }
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

        try {
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${locName}&country=Indonesia&method=11`);
            const d = await res.json();
            t = d.data.timings; h = d.data.date.hijri; readableDate = d.data.date.readable;
            localStorage.setItem('last_prayer_data', JSON.stringify(d.data));
            localStorage.setItem('last_prayer_date', todayStr);
        } catch (fetchError) {
            if (cachedPrayer) {
                const d = JSON.parse(cachedPrayer);
                t = d.timings; h = d.date.hijri; readableDate = d.date.readable;
            } else {
                throw new Error("Tidak ada internet & cache kosong");
            }
        }

        currentSchedule = { Subuh: t.Fajr, Dzuhur: t.Dhuhr, Ashar: t.Asr, Maghrib: t.Maghrib, Isya: t.Isha };

        const elHijri = document.getElementById('java-hijri'); 
        const elDate = document.getElementById('full-date');
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

    } catch (e) { 
        console.log("Beranda Mode Terbatas (Offline Tanpa Cache)"); 
        const pNameEl = document.getElementById('prayer-name'); 
        const pTimeEl = document.getElementById('prayer-time'); 
        const pCountEl = document.getElementById('countdown');
        if(pNameEl) pNameEl.innerText = "OFFLINE";
        if(pTimeEl) pTimeEl.innerText = "--:--";
        if(pCountEl) pCountEl.innerText = "MENUNGGU INTERNET";
    }
}

function renderCountdown(timings) {
    const now = new Date();
    const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    
    const schedule = [ 
        { name: 'SUBUH', time: timings.Fajr }, 
        { name: 'TERBIT', time: timings.Sunrise }, 
        { name: 'DZUHUR', time: timings.Dhuhr }, 
        { name: 'ASHAR', time: timings.Asr }, 
        { name: 'MAGHRIB', time: timings.Maghrib }, 
        { name: 'ISYA', time: timings.Isha } 
    ];
    
    let nextPrayer = null; 
    let nextPrayerMs = 0; 
    let nextIdx = 0;
    
    // 1. Cari sholat berikutnya (Mendatang)
    for (let i = 0; i < schedule.length; i++) {
        const [h, m] = schedule[i].time.split(':').map(Number);
        const pMs = h * 3600000 + m * 60000;
        if (pMs > currentMs) { 
            nextPrayer = schedule[i]; 
            nextPrayerMs = pMs; 
            nextIdx = i; 
            break; 
        }
    }
    // Jika tidak ada (lewat Isya), maka sholat berikutnya adalah Subuh besok
    if (!nextPrayer) {
        nextPrayer = schedule[0]; 
        nextIdx = 0; 
        const [h, m] = nextPrayer.time.split(':').map(Number);
        nextPrayerMs = (h + 24) * 3600000 + m * 60000;
    }

    // 2. Cari sholat sebelumnya (Waktu Berlalu)
    let prevIdx = nextIdx - 1;
    if (prevIdx < 0) prevIdx = schedule.length - 1;
    // Lewati waktu "Terbit" agar tulisan fokus ke sholat wajib
    if (schedule[prevIdx].name === 'TERBIT') prevIdx--; 
    if (prevIdx < 0) prevIdx = schedule.length - 1;

    let prevPrayer = schedule[prevIdx];
    const [ph, pm] = prevPrayer.time.split(':').map(Number);
    let prevPrayerMs = ph * 3600000 + pm * 60000;
    
    // Hitung selisih waktu berlalu
    let diffPassed = currentMs - prevPrayerMs;
    // Jika jam saat ini lewat tengah malam, tapi sholat sebelumnya (Isya) di hari kemarin
    if (diffPassed < 0) diffPassed += (24 * 3600000); 

    const passTotalMins = Math.floor(diffPassed / 60000);
    const passH = Math.floor(passTotalMins / 60);
    const passM = passTotalMins % 60;

// Menentukan Teks Waktu Berlalu
    let textPassed = "";
    
    // Jika waktu berlalunya mulai dari 0 sampai 10 menit
    if (passTotalMins <= 10) {
        textPassed = `<span class="text-teal-600">SEKARANG WAKTUNYA ${prevPrayer.name}</span>`;
    } 
    // Jika sudah lewat dari 10 menit
    else {
        let strTime = "";
        if (passH > 0) strTime += `${passH} jam `;
        strTime += `${passM} mnt`;
        textPassed = `${prevPrayer.name} ${strTime.trim()} lalu`;
    }

    // 3. Kalkulasi sisa hitung mundur (Mendatang)
    const diff = nextPrayerMs - currentMs;
    const s = Math.floor((diff / 1000) % 60); 
    const m = Math.floor((diff / 1000 / 60) % 60); 
    const h = Math.floor((diff / 1000 / 60 / 60));
    
    // 4. Masukkan data ke dalam HTML
    const pNameEl = document.getElementById('prayer-name'); 
    const pTimeEl = document.getElementById('prayer-time'); 
    const pCountEl = document.getElementById('countdown');
    const pPassedEl = document.getElementById('prayer-passed'); // Menyambung ke HTML baru

    if(pNameEl) pNameEl.innerText = nextPrayer.name;
    if(pTimeEl) pTimeEl.innerText = nextPrayer.time;
    if(pCountEl) pCountEl.innerText = `-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if(pPassedEl) pPassedEl.innerHTML = textPassed;
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
    content.innerHTML = window.getLoadingHtml("SINKRONISASI WAKTU...");
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
                html += `<div onclick="loadAppMenuDetail('${cat}', ${subItem.id}, ${item.id})" class="doa-item-card sub-item-card !mb-0 last:mb-0"><div class="doa-number !bg-teal-50/60 !text-teal-600 !border-teal-100">${i+1}.${j+1}</div><span class="doa-title-text">${subItem.title}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`;
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
    if (c.style.display === 'none') { c.style.display = 'block'; btn.innerHTML = '<i class="fa-solid fa-book-quran"></i>'; } 
    else { c.style.display = 'none'; btn.innerHTML = '<i class="fa-solid fa-book"></i>'; }
}

async function renderAppMenuDetailLogic(cat, id, parentFolderId = null) {
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

    let d;
    const cacheKey = info.path;

    if (window.ramCache[cacheKey]) {
        d = window.ramCache[cacheKey];
    } else {
        content.innerHTML = window.getLoadingHtml("MENGAMBIL BERKAH...");
        try {
            const res = await fetch(info.path); 
            d = await res.json();
            window.ramCache[cacheKey] = d; 
        } catch (error) {
            content.innerHTML = `<div class="text-center py-20"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-red-500 font-bold text-xs uppercase">Gagal Memuat Data</p></div>`; 
            return;
        }
    }

    let finalHtml = "";

    const judulMenu = info.title.toLowerCase().trim();
    const isQuranSurah = judulMenu === 'yasin' || judulMenu === 'surat yasin' || judulMenu === 'surah yasin' || cat === 'quran';

    if (d.metadata && d.konten && d.konten.bait_list) {
        let basmalahHtml = d.konten.pembuka_basmalah ? `<h3 class="font-kufi text-2xl text-teal-700 font-bold" dir="rtl">${d.konten.pembuka_basmalah}</h3>` : '';
        let garisHtml = (d.konten.pembuka_basmalah && d.konten.judul_utama) ? `<div class="w-16 h-[2px] bg-teal-50 mx-auto my-4 rounded-full"></div>` : '';
        let judulUtamaHtml = d.konten.judul_utama ? `<span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide block leading-relaxed">${d.konten.judul_utama}</span>` : '';
        
        let headerCard = `<div class="bg-white py-5 px-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 text-center">${basmalahHtml}${garisHtml}${judulUtamaHtml}</div>`;

        let baitHtml = '<div class="space-y-4">'; 
        d.konten.bait_list.forEach((bait, index) => {
            let textArab1 = "";
            let textArab2 = "";
            
            if (isQuranSurah) {
                textArab1 = bait.syathr_awal ? bait.syathr_awal.replace(/۝/g, '').replace(/([٠-٩]+)/g, '<span class="ayah-end-number">۝$1</span>') : '';
                textArab2 = bait.syathr_tsani ? bait.syathr_tsani.replace(/۝/g, '').replace(/([٠-٩]+)/g, '<span class="ayah-end-number">۝$1</span>') : '';
            } else {
                textArab1 = bait.syathr_awal ? bait.syathr_awal.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>') : '';
                textArab2 = bait.syathr_tsani ? bait.syathr_tsani.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>') : '';
            }

            let isSyair = (textArab1 !== '' && textArab2 !== '');
            let dynamicLineHeight = isSyair ? '1.8' : '2.2'; 
            let dynamicMargin = isSyair ? 'margin-bottom: 4px;' : '';

            baitHtml += `
                <div class="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div class="absolute -right-3 -top-3 w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center opacity-60">
                        <span class="text-teal-600 font-bold text-[10px] mt-3 mr-3">${index + 1}</span>
                    </div>
                    <div class="relative z-10 pr-3 pb-1">
                        ${textArab1 ? `<div class="text-right font-arab text-slate-900 w-full" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: ${dynamicLineHeight} !important; ${dynamicMargin}">${textArab1}</div>` : ''}
                        ${textArab2 ? `<div class="text-right font-arab text-slate-900 w-full" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: ${dynamicLineHeight} !important;">${textArab2}</div>` : ''}
                    ${(bait.terjemahan && bait.terjemahan.trim() !== '' && bait.terjemahan.trim() !== '-') ? `<div class="mt-3 text-left"><button onclick="toggleTerjemahanMulti(this, 'app-bait-terj-${index}')" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="app-bait-terj-${index}" style="display: none;" class="text-justify font-sans text-[11px] text-slate-500 mt-3 border-t pt-3 border-slate-100 font-medium leading-relaxed" dir="ltr">${bait.terjemahan}</div>` : ''}
                    </div>
                </div>
            `;
        });
        baitHtml += '</div>';
        finalHtml = `<div class="pb-6">${headerCard}${baitHtml}</div>`;
    }
    else {
        let teksLatin = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; 
        let teksArti = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : "";
        let kontenTambahan = ""; 
        if (teksLatin) kontenTambahan += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${teksLatin}</p>`; 
        if (teksArti) kontenTambahan += `<p class="translation-read-text text-slate-500 italic text-justify px-2">"${teksArti}"</p>`;
        
        const tampilanDetail = (teksLatin || teksArti) ? `<div class="mt-3 text-left mb-2"><button onclick="toggleMenuTerjemahan()" id="btn-toggle-menu-terjemahan" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="menu-terjemahan-container" style="display: none;"><div class="w-full h-[1px] bg-slate-100 my-4"></div>${kontenTambahan}</div>` : "";
        
        let teksArab = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || "");
        
        if (isQuranSurah) {
            teksArab = teksArab.replace(/۝/g, '');
            teksArab = teksArab.replace(/([٠-٩]+)/g, '<span class="ayah-end-number">۝$1</span>');
        } else {
            teksArab = teksArab.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>');
        }

        let basmalahHtml = d.judul ? `<div class="text-center mb-6"><h3 class="font-kufi text-2xl text-teal-700 font-bold bg-teal-50/50 inline-block px-5 py-2 rounded-xl border border-teal-100" dir="rtl">${d.judul}</h3></div><div class="w-full h-[1px] bg-slate-100 mb-8"></div>` : '';

        finalHtml = `<div class="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">${basmalahHtml}<p class="font-arab text-justify" dir="rtl" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important;">${teksArab}</p>${tampilanDetail}</div>`;
    }

    content.innerHTML = finalHtml;
}

/* ==========================================================================
   MESIN KALENDER PREMIUM
   ========================================================================== */
let currentCalDate = new Date(); let currentHijriData = []; const holidayCache = {}; const DATABASE_SKB = {};
function extractDynamicHolidays(apiData) { const dynamic = {}; if (Array.isArray(apiData)) { apiData.forEach(h => { const name = (h.localName + " " + h.name).toLowerCase(); dynamic[h.date] = { name: h.localName || h.name, type: (name.includes('cuti bersama') || name.includes('joint holiday')) ? 'cuti' : 'holiday' }; }); } return dynamic; }
async function getHolidayAPI(year) { const cacheKey = `holiday_api_${year}`; if (holidayCache[year]) return holidayCache[year]; const localCache = localStorage.getItem(cacheKey); if (localCache) { holidayCache[year] = JSON.parse(localCache); return holidayCache[year]; } try { const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`); const data = await res.json(); holidayCache[year] = data; localStorage.setItem(cacheKey, JSON.stringify(data)); return data; } catch (e) { return []; } }

async function fetchFullCalendarData() {
    const y = currentCalDate.getFullYear(); const m = currentCalDate.getMonth() + 1; const grid = document.getElementById('calendar-days-grid'); const cacheKey = `hijri_${m}_${y}`;
    grid.innerHTML = `<div class="col-span-7">${window.getLoadingHtml("MEMUAT KALENDER...")}</div>`;
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
        let dateColorClass = ''; 
        if (isSunday) { 
            dateColorClass = 'is-sunday-holiday'; 
        } else if (namaLibur && !isCutiBersama) { 
            dateColorClass = 'is-national-holiday'; 
        } else if (isCutiBersama) { 
            dateColorClass = 'is-cuti-bersama'; 
        }
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
const quranBaseUrl = 'quran';
let currentQuranTab = 'surah';
let currentQuranView = 'list';
let currentSurahAudioFull = null;
let currentAudio = null;
let isTranslationVisible = false;
window.ayatData = {}; 
let quranBookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
window.currentlyPlayingAyatKey = null;

const quranJuzMapping = [
    { juz: 1, start: { s: 1, a: 1 }, end: { s: 2, a: 141 } },
    { juz: 2, start: { s: 2, a: 142 }, end: { s: 2, a: 252 } },
    { juz: 3, start: { s: 2, a: 253 }, end: { s: 3, a: 91 } }, 
    { juz: 4, start: { s: 3, a: 92 }, end: { s: 4, a: 23 } },  
    { juz: 5, start: { s: 4, a: 24 }, end: { s: 4, a: 147 } },
    { juz: 6, start: { s: 4, a: 148 }, end: { s: 5, a: 82 } }, 
    { juz: 7, start: { s: 5, a: 83 }, end: { s: 6, a: 110 } }, 
    { juz: 8, start: { s: 6, a: 111 }, end: { s: 7, a: 87 } },
    { juz: 9, start: { s: 7, a: 88 }, end: { s: 8, a: 40 } },
    { juz: 10, start: { s: 8, a: 41 }, end: { s: 9, a: 93 } }, 
    { juz: 11, start: { s: 9, a: 94 }, end: { s: 11, a: 5 } }, 
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
    { juz: 22, start: { s: 33, a: 31 }, end: { s: 36, a: 21 } },
    { juz: 23, start: { s: 36, a: 22 }, end: { s: 39, a: 31 } }, 
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
        if (typeof stopAudio === "function") stopAudio(); 
        switchQuranTab(currentQuranTab); 
        setTimeout(() => { const c = document.getElementById('quran-content'); if (c) c.scrollTop = window.lastQuranScroll || 0; }, 10);
    } else { 
        document.getElementById('quran-modal').classList.remove('modal-show'); 
        if (typeof resetNavToBeranda === "function") resetNavToBeranda(); 
        if (typeof stopAudio === "function") stopAudio(); 
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

const daftarSurahLokal = [
    { nomor: 1, namaLatin: "Al-Fatihah", arti: "Pembukaan", nama: "الفاتحة" },
    { nomor: 2, namaLatin: "Al-Baqarah", arti: "Sapi", nama: "البقرة" },
    { nomor: 3, namaLatin: "Ali 'Imran", arti: "Keluarga Imran", nama: "اٰل عمران" },
    { nomor: 4, namaLatin: "An-Nisa'", arti: "Wanita", nama: "النساۤء" },
    { nomor: 5, namaLatin: "Al-Ma'idah", arti: "Hidangan", nama: "الماۤئدة" },
    { nomor: 6, namaLatin: "Al-An'am", arti: "Binatang Ternak", nama: "الانعام" },
    { nomor: 7, namaLatin: "Al-A'raf", arti: "Tempat Tertinggi", nama: "الاعراف" },
    { nomor: 8, namaLatin: "Al-Anfal", arti: "Rampasan Perang", nama: "الانفال" },
    { nomor: 9, namaLatin: "At-Taubah", arti: "Pengampunan", nama: "التوبة" },
    { nomor: 10, namaLatin: "Yunus", arti: "Yunus", nama: "يونس" },
    { nomor: 11, namaLatin: "Hud", arti: "Hud", nama: "هود" },
    { nomor: 12, namaLatin: "Yusuf", arti: "Yusuf", nama: "يوسف" },
    { nomor: 13, namaLatin: "Ar-Ra'd", arti: "Guruh", nama: "الرّعد" },
    { nomor: 14, namaLatin: "Ibrahim", arti: "Ibrahim", nama: "ابرٰهيم" },
    { nomor: 15, namaLatin: "Al-Hijr", arti: "Hijr", nama: "الحجر" },
    { nomor: 16, namaLatin: "An-Nahl", arti: "Lebah", nama: "النحل" },
    { nomor: 17, namaLatin: "Al-Isra'", arti: "Memperjalankan Malam Hari", nama: "الاسراۤء" },
    { nomor: 18, namaLatin: "Al-Kahf", arti: "Goa", nama: "الكهف" },
    { nomor: 19, namaLatin: "Maryam", arti: "Maryam", nama: "مريم" },
    { nomor: 20, namaLatin: "Taha", arti: "Taha", nama: "طٰهٰ" },
    { nomor: 21, namaLatin: "Al-Anbiya'", arti: "Para Nabi", nama: "الانبياۤء" },
    { nomor: 22, namaLatin: "Al-Hajj", arti: "Haji", nama: "الحج" },
    { nomor: 23, namaLatin: "Al-Mu'minun", arti: "Orang-Orang Mukmin", nama: "المؤمنون" },
    { nomor: 24, namaLatin: "An-Nur", arti: "Cahaya", nama: "النّور" },
    { nomor: 25, namaLatin: "Al-Furqan", arti: "Pembeda", nama: "الفرقان" },
    { nomor: 26, namaLatin: "Asy-Syu'ara'", arti: "Para Penyair", nama: "الشعراۤء" },
    { nomor: 27, namaLatin: "An-Naml", arti: "Semut-semut", nama: "النمل" },
    { nomor: 28, namaLatin: "Al-Qasas", arti: "Kisah-Kisah", nama: "القصص" },
    { nomor: 29, namaLatin: "Al-'Ankabut", arti: "Laba-Laba", nama: "العنكبوت" },
    { nomor: 30, namaLatin: "Ar-Rum", arti: "Romawi", nama: "الرّوم" },
    { nomor: 31, namaLatin: "Luqman", arti: "Luqman", nama: "لقمٰن" },
    { nomor: 32, namaLatin: "As-Sajdah", arti: "Sajdah", nama: "السّجدة" },
    { nomor: 33, namaLatin: "Al-Ahzab", arti: "Golongan Yang Bersekutu", nama: "الاحزاب" },
    { nomor: 34, namaLatin: "Saba'", arti: "Saba'", nama: "سبأ" },
    { nomor: 35, namaLatin: "Fatir", arti: "Maha Pencipta", nama: "فاطر" },
    { nomor: 36, namaLatin: "Yasin", arti: "Yasin", nama: "يٰسۤ" },
    { nomor: 37, namaLatin: "As-Saffat", arti: "Barisan-Barisan", nama: "الصّٰۤفّٰت" },
    { nomor: 38, namaLatin: "Sad", arti: "Sad", nama: "ص" },
    { nomor: 39, namaLatin: "Az-Zumar", arti: "Rombongan", nama: "الزمر" },
    { nomor: 40, namaLatin: "Gafir", arti: "Maha Pengampun", nama: "غافر" },
    { nomor: 41, namaLatin: "Fussilat", arti: "Yang Dijelaskan", nama: "فصّلت" },
    { nomor: 42, namaLatin: "Asy-Syura", arti: "Musyawarah", nama: "الشورى" },
    { nomor: 43, namaLatin: "Az-Zukhruf", arti: "Perhiasan", nama: "الزخرف" },
    { nomor: 44, namaLatin: "Ad-Dukhan", arti: "Kabut", nama: "الدخان" },
    { nomor: 45, namaLatin: "Al-Jasiyah", arti: "Berlutut", nama: "الجاثية" },
    { nomor: 46, namaLatin: "Al-Ahqaf", arti: "Bukit Pasir", nama: "الاحقاف" },
    { nomor: 47, namaLatin: "Muhammad", arti: "Muhammad", nama: "محمّد" },
    { nomor: 48, namaLatin: "Al-Fath", arti: "Kemenangan", nama: "الفتح" },
    { nomor: 49, namaLatin: "Al-Hujurat", arti: "Kamar-Kamar", nama: "الحجرٰت" },
    { nomor: 50, namaLatin: "Qaf", arti: "Qaf", nama: "ق" },
    { nomor: 51, namaLatin: "Az-Zariyat", arti: "Angin yang Menerbangkan", nama: "الذّٰريٰت" },
    { nomor: 52, namaLatin: "At-Tur", arti: "Bukit Tursina", nama: "الطور" },
    { nomor: 53, namaLatin: "An-Najm", arti: "Bintang", nama: "النجم" },
    { nomor: 54, namaLatin: "Al-Qamar", arti: "Bulan", nama: "القمر" },
    { nomor: 55, namaLatin: "Ar-Rahman", arti: "Maha Pengasih", nama: "الرحمن" },
    { nomor: 56, namaLatin: "Al-Waqi'ah", arti: "Hari Kiamat", nama: "الواقعة" },
    { nomor: 57, namaLatin: "Al-Hadid", arti: "Besi", nama: "الحديد" },
    { nomor: 58, namaLatin: "Al-Mujadalah", arti: "Gugatan", nama: "المجادلة" },
    { nomor: 59, namaLatin: "Al-Hasyr", arti: "Pengusiran", nama: "الحشر" },
    { nomor: 60, namaLatin: "Al-Mumtahanah", arti: "Wanita Yang Diuji", nama: "الممتحنة" },
    { nomor: 61, namaLatin: "As-Saff", arti: "Barisan", nama: "الصّفّ" },
    { nomor: 62, namaLatin: "Al-Jumu'ah", arti: "Jumat", nama: "الجمعة" },
    { nomor: 63, namaLatin: "Al-Munafiqun", arti: "Orang-Orang Munafik", nama: "المنٰفقون" },
    { nomor: 64, namaLatin: "At-Tagabun", arti: "Pengungkapan Kesalahan", nama: "التغابن" },
    { nomor: 65, namaLatin: "At-Talaq", arti: "Talak", nama: "الطلاق" },
    { nomor: 66, namaLatin: "At-Tahrim", arti: "Pengharaman", nama: "التحريم" },
    { nomor: 67, namaLatin: "Al-Mulk", arti: "Kerajaan", nama: "الملك" },
    { nomor: 68, namaLatin: "Al-Qalam", arti: "Pena", nama: "القلم" },
    { nomor: 69, namaLatin: "Al-Haqqah", arti: "Hari Kiamat", nama: "الحاۤقّة" },
    { nomor: 70, namaLatin: "Al-Ma'arij", arti: "Tempat Naik", nama: "المعارج" },
    { nomor: 71, namaLatin: "Nuh", arti: "Nuh", nama: "نوح" },
    { nomor: 72, namaLatin: "Al-Jinn", arti: "Jin", nama: "الجن" },
    { nomor: 73, namaLatin: "Al-Muzzammil", arti: "Orang Yang Berselimut", nama: "المزّمّل" },
    { nomor: 74, namaLatin: "Al-Muddassir", arti: "Orang Yang Berkemul", nama: "المدّثّر" },
    { nomor: 75, namaLatin: "Al-Qiyamah", arti: "Hari Kiamat", nama: "القيٰمة" },
    { nomor: 76, namaLatin: "Al-Insan", arti: "Manusia", nama: "الانسان" },
    { nomor: 77, namaLatin: "Al-Mursalat", arti: "Malaikat Yang Diutus", nama: "المرسلٰت" },
    { nomor: 78, namaLatin: "An-Naba'", arti: "Berita Besar", nama: "النبأ" },
    { nomor: 79, namaLatin: "An-Nazi'at", arti: "Malaikat Yang Mencabut", nama: "النّٰزعٰت" },
    { nomor: 80, namaLatin: "'Abasa", arti: "Bermuka Masam", nama: "عبس" },
    { nomor: 81, namaLatin: "At-Takwir", arti: "Penggulungan", nama: "التكوير" },
    { nomor: 82, namaLatin: "Al-Infitar", arti: "Terbelah", nama: "الانفطار" },
    { nomor: 83, namaLatin: "Al-Mutaffifin", arti: "Orang-Orang Curang", nama: "المطفّفين" },
    { nomor: 84, namaLatin: "Al-Insyiqaq", arti: "Terbelah", nama: "الانشقاق" },
    { nomor: 85, namaLatin: "Al-Buruj", arti: "Gugusan Bintang", nama: "البروج" },
    { nomor: 86, namaLatin: "At-Tariq", arti: "Yang Datang Di Malam Hari", nama: "الطارق" },
    { nomor: 87, namaLatin: "Al-A'la", arti: "Maha Tinggi", nama: "الاعلى" },
    { nomor: 88, namaLatin: "Al-Gasyiyah", arti: "Hari Kiamat", nama: "الغاشية" },
    { nomor: 89, namaLatin: "Al-Fajr", arti: "Fajar", nama: "الفجر" },
    { nomor: 90, namaLatin: "Al-Balad", arti: "Negeri", nama: "البلد" },
    { nomor: 91, namaLatin: "Asy-Syams", arti: "Matahari", nama: "الشمس" },
    { nomor: 92, namaLatin: "Al-Lail", arti: "Malam", nama: "الّيل" },
    { nomor: 93, namaLatin: "Ad-Duha", arti: "Duha", nama: "الضحى" },
    { nomor: 94, namaLatin: "Asy-Syarh", arti: "Lapang", nama: "الشرح" },
    { nomor: 95, namaLatin: "At-Tin", arti: "Buah Tin", nama: "التين" },
    { nomor: 96, namaLatin: "Al-'Alaq", arti: "Segumpal Darah", nama: "العلق" },
    { nomor: 97, namaLatin: "Al-Qadr", arti: "Kemuliaan", nama: "القدر" },
    { nomor: 98, namaLatin: "Al-Bayyinah", arti: "Bukti Nyata", nama: "البيّنة" },
    { nomor: 99, namaLatin: "Az-Zalzalah", arti: "Guncangan", nama: "الزلزلة" },
    { nomor: 100, namaLatin: "Al-'Adiyat", arti: "Kuda Yang Berlari Kencang", nama: "العٰديٰت" },
    { nomor: 101, namaLatin: "Al-Qari'ah", arti: "Hari Kiamat", nama: "القارعة" },
    { nomor: 102, namaLatin: "At-Takasur", arti: "Bermegah-Megahan", nama: "التكاثر" },
    { nomor: 103, namaLatin: "Al-'Asr", arti: "Asar", nama: "العصر" },
    { nomor: 104, namaLatin: "Al-Humazah", arti: "Pengumpat", nama: "الهمزة" },
    { nomor: 105, namaLatin: "Al-Fil", arti: "Gajah", nama: "الفيل" },
    { nomor: 106, namaLatin: "Quraisy", arti: "Quraisy", nama: "قريش" },
    { nomor: 107, namaLatin: "Al-Ma'un", arti: "Barang Yang Berguna", nama: "الماعون" },
    { nomor: 108, namaLatin: "Al-Kausar", arti: "Pemberian Yang Banyak", nama: "الكوثر" },
    { nomor: 109, namaLatin: "Al-Kafirun", arti: "Orang-Orang kafir", nama: "الكٰفرون" },
    { nomor: 110, namaLatin: "An-Nasr", arti: "Pertolongan", nama: "النصر" },
    { nomor: 111, namaLatin: "Al-Lahab", arti: "Api Yang Bergejolak", nama: "اللهب" },
    { nomor: 112, namaLatin: "Al-Ikhlas", arti: "Ikhlas", nama: "الاخلاص" },
    { nomor: 113, namaLatin: "Al-Falaq", arti: "Subuh", nama: "الفلق" },
    { nomor: 114, namaLatin: "An-Nas", arti: "Manusia", nama: "الناس" }
];

function loadSurahList() { 
    const c = document.getElementById('quran-content'); 
    document.getElementById('surah-title-arab').innerText = ""; 
    document.getElementById('surah-title-latin').innerText = ""; 
    document.getElementById('surah-subtitle').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 
    
    let html = ''; 
    daftarSurahLokal.forEach(s => { 
        html += `
        <div onclick="loadDetailQuran(${s.nomor}, 'surah')" class="quran-item w-full flex items-center justify-between p-3 mb-2 bg-white rounded-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all shadow-sm hover:shadow-md">
            <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <span class="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">${s.nomor}</span>
                <div class="truncate">
                    <h4 class="font-bold text-[13px] text-slate-700 uppercase truncate">${s.namaLatin}</h4>
                    <p class="text-[9px] text-slate-500 font-semibold uppercase truncate">${s.arti}</p>
                </div>
            </div>
            <div class="shrink-0 pl-3 flex items-center">
              <span class="text-teal-600" style="font-family: 'lpmq', serif !important; font-size: clamp(15px, 4.5vw, 20px) !important; line-height: 1.2 !important; margin-top: 1px; white-space: nowrap;" dir="rtl" lang="ar">${s.nama}</span>
            </div>
        </div>`; 
    }); 
    
    c.innerHTML = html; 
    checkZoomBtnVisibility(); 
}

async function loadJuzList() { 
    const c = document.getElementById('quran-content'); 
    document.getElementById('surah-title-arab').innerText = ""; 
    document.getElementById('surah-title-latin').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 
    
    let html = ''; 
    for (let i = 1; i <= 30; i++) { 
        html += `
        <div onclick="loadDetailQuran(${i}, 'juz')" class="quran-item w-full flex items-center justify-between p-3 mb-2 bg-white rounded-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all shadow-sm hover:shadow-md">
            <div class="flex items-center gap-3 shrink-0">
                <span class="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center text-xs font-bold shrink-0">${i}</span>
                <h4 class="font-bold text-[13px] text-slate-700 uppercase whitespace-nowrap">Juz ${i}</h4>
            </div>
            <div class="shrink-0 pl-3 flex items-center">
              <span class="text-teal-600" style="font-family: 'lpmq', serif !important; font-size: clamp(14px, 4vw, 18px) !important; line-height: 1.2 !important; margin-top: 1px; white-space: nowrap;" dir="rtl" lang="ar">${namaJuzArab[i-1]}</span>
            </div>
        </div>`; 
    } 
    c.innerHTML = html; 
    checkZoomBtnVisibility(); 
}

window.loadDetailQuran = async function(id, type) {
    if (!isPopping) history.pushState({ page: 'quran_detail' }, '', '#quran-detail');
    currentQuranView = 'detail'; 
    checkZoomBtnVisibility();
    
    const c = document.getElementById('quran-content'); 
    window.lastQuranScroll = c.scrollTop;
    c.scrollTop = 0; 
    document.getElementById('quran-sticky-header').classList.remove('header-slim'); 
    document.getElementById('quran-tabs').classList.add('hidden');
    window.ayatData = {};

    try {
        if (type === 'surah') { await renderSurah(id, c); } 
        else { await renderJuz(id, c); }
    } catch (e) {
        c.innerHTML = '<p class="text-center p-10 font-bold text-red-400">Gagal memuat konten.</p>';
    }
}

function getAudioAyatUrl(qariId, nomorSurah, nomorAyat) {
    const qariMap = { '01': 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', '02': 'Abdul_Basit_Murattal_192kbps', '03': 'Abdurrahmaan_As-Sudais_192kbps', '04': 'Yasser_Ad-Dussary_128kbps', '05': 'Alafasy_128kbps' };
    const s = String(nomorSurah).padStart(3, '0'); const a = String(nomorAyat).padStart(3, '0');
    return `https://everyayah.com/data/${qariMap[qariId] || 'Alafasy_128kbps'}/${s}${a}.mp3`;
}

function getAudioFullUrl(qariId, nomorSurah) {
    const qariMap = { '01': 'https://server13.mp3quran.net/jhn', '02': 'https://server7.mp3quran.net/basit', '03': 'https://server11.mp3quran.net/sds', '04': 'https://server11.mp3quran.net/yasser', '05': 'https://server8.mp3quran.net/afs' };
    const s = String(nomorSurah).padStart(3, '0');
    return `${qariMap[qariId] || 'https://server8.mp3quran.net/afs'}/${s}.mp3`;
}

async function renderSurah(nomorSurah, container) {
    let json;
    const cacheKey = `quran/surah/${nomorSurah}.json`;

    if (window.ramCache[cacheKey]) {
        json = window.ramCache[cacheKey];
    } else {
        container.innerHTML = window.getLoadingHtml("MEMUAT SURAH...");
        const response = await fetch(cacheKey);
        json = await response.json();
        window.ramCache[cacheKey] = json;
    }
    const surah = json[nomorSurah.toString()];

    document.getElementById('surah-title-arab').innerText = surah.name; 
    document.getElementById('surah-title-arab').style.fontFamily = "'SurahNameCustom', 'lpmq', serif";
    document.getElementById('surah-title-latin').innerText = surah.name_latin; 
    document.getElementById('surah-subtitle').innerText = `(${surah.translations.id.name})`; 
    document.getElementById('surah-info-count').innerText = `${surah.number_of_ayah} Ayat`; 
    document.getElementById('surah-info-type').innerText = "Al-Quran"; 
    document.getElementById('surah-meta-info').classList.remove('hidden'); 

    const defaultFullAudio = getAudioFullUrl('05', nomorSurah);
    
    let html = `
        <div class="mb-6 bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-0 opacity-60"></div>
            <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-teal-100"><i class="fa-solid fa-headphones text-[13px]"></i></div>
                    <label for="qari-select" class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">Qari Murottal</label>
                </div>
                <div class="relative">
                    <select id="qari-select" class="appearance-none bg-slate-50 border border-slate-200 text-teal-700 font-bold text-[11px] py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all cursor-pointer shadow-sm" onchange="changeQariQuran(this, ${nomorSurah})">
                        <option value="01">Abdullah Al-Juhany</option><option value="02">Abdul Basit</option><option value="03">A. as-Sudais</option><option value="04">Yasser Al-Dosari</option><option value="05" selected>Misyari Rasyid</option>
                    </select>
                    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-teal-600 pointer-events-none"></i>
                </div>
            </div>
            <audio id="surah-audio-full" class="w-full h-10 custom-audio relative z-10 mt-1" controls><source id="audio-source-full" src="${defaultFullAudio}" type="audio/mpeg"></audio>
        </div>
        <div class="surah-separator" style="margin-top:0;">`;
    
    if (nomorSurah !== 1 && nomorSurah !== 9) { html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`; }
    html += `</div>`; 

    const totalAyat = parseInt(surah.number_of_ayah);
    for (let i = 1; i <= totalAyat; i++) {
        const ayatObj = { nomorAyat: i, teksArab: surah.text[i.toString()], teksIndonesia: surah.translations.id.text[i.toString()] };
        html += createAyatCardQuran(ayatObj, nomorSurah);
    }
    container.innerHTML = html;
}

async function renderJuz(nomorJuz, container) {
    document.getElementById('surah-title-arab').innerText = namaJuzArab[nomorJuz - 1]; 
    document.getElementById('surah-title-arab').style.fontFamily = "'lpmq', serif";
    document.getElementById('surah-title-latin').innerText = `Juz ${nomorJuz}`; 
    document.getElementById('surah-subtitle').innerText = ""; 
    document.getElementById('surah-meta-info').classList.add('hidden'); 

    const juzInfo = quranJuzMapping[nomorJuz - 1];
    let results;
    const cacheKey = `quran/juz/${nomorJuz}`;

    if (window.ramCache[cacheKey]) {
        results = window.ramCache[cacheKey];
    } else {
        container.innerHTML = window.getLoadingHtml("MEMUAT JUZ...");
        let fetchPromises = [];
        for (let s = juzInfo.start.s; s <= juzInfo.end.s; s++) { fetchPromises.push(fetch(`${quranBaseUrl}/surah/${s}.json`).then(r => r.json())); }
        results = await Promise.all(fetchPromises);
        window.ramCache[cacheKey] = results;
    }
    
    let html = '';

    results.forEach(res => {
        let nomorSurahStr = Object.keys(res)[0];
        let surah = res[nomorSurahStr];
        let nomorSurah = parseInt(nomorSurahStr);
        let mulaiAyat = 1; let akhirAyat = parseInt(surah.number_of_ayah);

        if (nomorSurah === juzInfo.start.s) { mulaiAyat = juzInfo.start.a; }
        if (nomorSurah === juzInfo.end.s) { akhirAyat = juzInfo.end.a; }

        if (akhirAyat >= mulaiAyat) {
            if (mulaiAyat === 1) {
                let tempatTurun = surah.tempat_turun || surah.tempatTurun || surah.type || "Makkiyah";
                let jenisSurah = tempatTurun.toLowerCase().includes('madin') ? 'Madaniyah' : 'Makkiyah';

                html += `<div class="surah-separator"><div class="mushaf-surah-header"><div class="mushaf-side-panel">${jenisSurah}</div><div class="mushaf-center-panel"><span class="surah-arabic-name">${surah.name}</span></div><div class="mushaf-side-panel">${surah.number_of_ayah} Ayat</div></div>`;
                if (nomorSurah !== 1 && nomorSurah !== 9) { html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`; }
                html += `</div>`;
            } else { html += `<div class="juz-continue-header">Melanjutkan Surah ${surah.name_latin} (Ayat ${mulaiAyat})</div>`; }

            for(let i = mulaiAyat; i <= akhirAyat; i++) {
                const ayatObj = { nomorAyat: i, teksArab: surah.text[i.toString()], teksIndonesia: surah.translations.id.text[i.toString()] };
                html += createAyatCardQuran(ayatObj, nomorSurah);
            }
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
    const audioEl = document.getElementById('per-ayat-audio');
    if (window.currentlyPlayingAyatKey === uniqueKey && audioEl && !audioEl.paused) {
        playIcon = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    }

    return `
        <div class="ayat-card">
            <div class="action-bar">
                <div class="ayah-number-circle bg-teal-50 text-teal-600 font-bold flex items-center justify-center rounded-full shrink-0 border border-teal-100">${ayat.nomorAyat}</div>
                <button id="play-btn-${uniqueKey}" class="action-btn play-btn" onclick="playAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')">${playIcon}</button>
                <button id="bm-btn-${uniqueKey}" class="action-btn ${isBookmarked}" onclick="bookmarkAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>
                <button class="action-btn" onclick="showTafsirQuran('${nomorSurah}', '${ayat.nomorAyat}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></button>
                <button class="action-btn" onclick="copyAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                <button class="action-btn" onclick="shareAyatQuran('${nomorSurah}', '${ayat.nomorAyat}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
            </div>
            <div class="ayat-arabic" lang="ar">${ayat.teksArab.replace(/ࣖ/g, '<span class="sajdah-mark">۩</span>')}</div>
            <div class="translation-read-text text-slate-500 italic leading-relaxed text-justify ${hiddenClass}">${ayat.teksIndonesia}</div>
        </div>
    `;
}

window.changeQariQuran = function(selectElement, nomorSurah) {
    const audioPlayer = document.getElementById('surah-audio-full');
    const audioSource = document.getElementById('audio-source-full');
    const isPlaying = !audioPlayer.paused && !audioPlayer.ended && audioPlayer.readyState > 2;

    audioSource.src = getAudioFullUrl(selectElement.value, nomorSurah);
    audioPlayer.load(); 
    if (isPlaying) audioPlayer.play();
}

window.playAyatQuran = function(nomorSurah, nomorAyat) {
    const uniqueKey = `${nomorSurah}_${nomorAyat}`;
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
        if (audioEl.paused) { audioEl.play().catch(e => showToast("Gagal memutar ayat.", "error")); } 
        else { audioEl.pause(); }
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

    audioEl.src = getAudioAyatUrl(qariKey, nomorSurah, nomorAyat);
    window.currentlyPlayingAyatKey = uniqueKey;
    audioEl.play().catch(e => showToast("Gagal memutar ayat. Pastikan ada internet.", "error"));
}

window.copyAyatQuran = function(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    const textToCopy = `${ayat.teksArab}\n\n${ayat.teksIndonesia}\n(QS. ${nomorSurah}:${nomorAyat})`;
    navigator.clipboard.writeText(textToCopy).then(() => showToast(`Ayat ke-${nomorAyat} disalin!`, 'success'));
}

window.shareAyatQuran = function(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    const textToShare = `${ayat.teksArab}\n\n${ayat.teksIndonesia}\n(QS. ${nomorSurah}:${nomorAyat})`;

    if (navigator.share) {
        // Jika dibuka di browser biasa (Chrome/Safari)
        navigator.share({ 
            title: `QS. ${nomorSurah}:${nomorAyat}`, 
            text: textToShare 
        }).catch(console.error); 
    } else { 
        // JIKA DIBUKA DI DALAM APK (Otomatis lempar ke WhatsApp)
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
        window.open(waUrl, '_blank');
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
    bodyText.innerHTML = window.getLoadingHtml("MENGAMBIL TAFSIR...");
    
    try {
        const response = await fetch(`${quranBaseUrl}/surah/${nomorSurah}.json`);
        const json = await response.json();
        const dataTafsir = json[nomorSurah.toString()].tafsir.id.kemenag.text[nomorAyat.toString()];
        
        if (dataTafsir) {
            let textRaw = dataTafsir.replace(/(\d+)\.([a-zA-Z])/g, ' x$1 . $2').replace(/(^|\n)([a-z])\.([a-zA-Z])/g, ' x$1 $2. $3');
            bodyText.innerHTML = textRaw.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom:12px;">${p.trim()}</p>`).join('');
        } else {
            bodyText.innerHTML = '<p>Data tafsir tidak ditemukan.</p>';
        }
    } catch (error) {
        bodyText.innerHTML = '<p style="color:red; text-align:center;">Gagal terhubung ke data Tafsir.</p>';
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
    if (e.target === this) { if(!isPopping) history.back(); else closeTafsir(); }
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
    } else { currentDoaParentFolderId = null; }
}

function toggleDoa() {
    const el = document.getElementById('doa-modal');
    if (!el.classList.contains('modal-show')) {
        const wasOpen = document.querySelectorAll('.modal-show').length > 0;
        closeAllModals(); 
        if (!isPopping) { if (wasOpen) history.replaceState({ modal: 'doa' }, '', '#doa'); else history.pushState({ modal: 'doa' }, '', '#doa'); }
        el.classList.add('modal-show'); currentDoaParentFolderId = null; loadDoaList(); checkZoomBtnVisibility();
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
            
            html += `<div class="submenu-container mb-3"><div onclick="toggleDoaAccordion(this, ${d.id})" class="doa-item-card !mb-0"><div class="doa-number">${i+1}</div><span class="doa-title-text">${d.judul}</span><i class="${arrowClass}"></i></div><div class="${wrapperClass}" ${maxH}><div class="p-2 space-y-2">`;
            d.subItems.forEach((subItem, j) => { html += `<div onclick="loadDoaDetail(${subItem.id}, ${d.id})" class="doa-item-card sub-item-card !mb-0 last:mb-0"><div class="doa-number !bg-teal-50/60 !text-teal-600 !border-teal-100">${i+1}.${j+1}</div><span class="doa-title-text">${subItem.judul}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`; });
            html += `</div></div></div>`;
        } 
        else { html += `<div onclick="loadDoaDetail(${d.id})" class="doa-item-card"><div class="doa-number">${i+1}</div><span class="doa-title-text">${d.judul}</span><i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i></div>`; }
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
    if (c.style.display === 'none') { c.style.display = 'block'; btn.innerHTML = '<i class="fa-solid fa-book-quran"></i>'; } 
    else { c.style.display = 'none'; btn.innerHTML = '<i class="fa-solid fa-book"></i>'; } 
}

async function renderDoaDetailLogic(id, parentFolderId = null) {
    let activeArray = [];
    if (parentFolderId !== null) { const folder = dataDoaMadasa.find(x => x.id === parentFolderId); activeArray = folder.subItems; } 
    else { activeArray = dataDoaMadasa.filter(x => !x.subItems); }
    
    const c = document.getElementById('doa-content'); 
    const idx = activeArray.findIndex(i => i.id === id); const info = activeArray[idx]; if(!info) return;
    
    document.getElementById('doa-header-title').innerText = info.judul; 
    c.scrollTop = 0; document.getElementById('doa-sticky-header').classList.remove('doa-header-slim');
    
    let navHtml = ''; 
    if (idx > 0) navHtml += `<button onclick="loadDoaDetail(${activeArray[idx - 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-left"></i></button>`; 
    if (idx < activeArray.length - 1) navHtml += `<button onclick="loadDoaDetail(${activeArray[idx + 1].id}, ${parentFolderId})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-right"></i></button>`; 
    document.getElementById('doa-nav-controls').innerHTML = navHtml;
    
    let d;
    const cacheKey = info.path;

    if (window.ramCache[cacheKey]) {
        d = window.ramCache[cacheKey];
    } else {
        c.innerHTML = window.getLoadingHtml("MEMUAT DOA...");
        try { const res = await fetch(info.path); d = await res.json(); window.ramCache[cacheKey] = d; } 
        catch (e) { c.innerHTML = `<div class="text-center p-10"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-xs text-red-500 font-bold uppercase">Gagal memuat doa</p></div>`; return; }
    }

    let finalHtml = "";

    if (d.metadata && d.konten && d.konten.bait_list) {
        let basmalahHtml = d.konten.pembuka_basmalah ? `<h3 class="font-kufi text-2xl text-teal-700 font-bold" dir="rtl">${d.konten.pembuka_basmalah}</h3>` : '';
        let garisHtml = (d.konten.pembuka_basmalah && d.konten.judul_utama) ? `<div class="w-16 h-[2px] bg-teal-50 mx-auto my-4 rounded-full"></div>` : '';
        let judulUtamaHtml = d.konten.judul_utama ? `<span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide block leading-relaxed">${d.konten.judul_utama}</span>` : '';
        let headerCard = (basmalahHtml || judulUtamaHtml) ? `<div class="bg-white py-5 px-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 text-center">${basmalahHtml}${garisHtml}${judulUtamaHtml}</div>` : '';

        let baitHtml = '<div class="space-y-4">'; 
        d.konten.bait_list.forEach((bait, index) => {
            let textArab1 = bait.syathr_awal ? bait.syathr_awal.replace(/([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>') : '';
            let textArab2 = bait.syathr_tsani ? bait.syathr_tsani.replace(/([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>') : '';

            let terjemahanHtml = (bait.terjemahan && bait.terjemahan.trim() !== '' && bait.terjemahan.trim() !== '-') ? `<div class="mt-3 text-left mb-2"><button onclick="toggleTerjemahanMulti(this, 'doa-bait-terj-${index}')" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="doa-bait-terj-${index}" style="display: none;" class="text-justify font-sans text-[11px] text-slate-500 mt-3 border-t pt-3 border-slate-100 font-medium leading-relaxed" dir="ltr">${bait.terjemahan}</div>` : '';

            baitHtml += `<div class="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden"><div class="absolute -right-3 -top-3 w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center opacity-60"><span class="text-teal-600 font-bold text-[10px] mt-3 mr-3">${index + 1}</span></div><div class="relative z-10 pr-3 pb-1">${textArab1 ? `<div class="text-right font-arab text-slate-900 w-full" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important; margin-bottom: 8px;">${textArab1}</div>` : ''}${textArab2 ? `<div class="text-right font-arab text-slate-900 w-full" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important; margin-bottom: 8px;">${textArab2}</div>` : ''}${terjemahanHtml}</div></div>`;
        });
        baitHtml += '</div>'; finalHtml = `<div class="pb-6">${headerCard}${baitHtml}</div>`;
    }
    else if (d.kumpulan && Array.isArray(d.kumpulan)) {
        d.kumpulan.forEach((item, index) => {
            let tLat = item.latin ? (Array.isArray(item.latin) ? item.latin.join('<br><br>') : item.latin) : ""; let tArt = item.arti ? (Array.isArray(item.arti) ? item.arti.join('<br><br>') : item.arti) : ""; 
            let kt = ""; 
            if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
            if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
            
            const tDet = kt ? `<div class="mt-3 text-left mb-2"><button onclick="toggleTerjemahanMulti(this, 'doa-terj-${index}')" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="doa-terj-${index}" style="display: none;"><div class="w-full h-[1px] bg-slate-100 my-4"></div>${kt}</div>` : ""; 
            
            let tAr = Array.isArray(item.arab) ? item.arab.join(' ') : (item.arab || ""); tAr = tAr.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>');
            let basmalahHtml = item.judul ? `<div class="text-center mb-6"><h3 class="font-kufi text-lg text-teal-700 font-bold">${item.judul}</h3></div>` : `<div class="text-center mb-6"><h3 class="font-arab text-xl text-teal-600 leading-none" lang="ar" dir="rtl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3></div>`;
            let garisHtml = `<div class="w-full h-[1px] bg-slate-100 mb-6"></div>`; let judulUtamaHtml = item.judul_utama ? `<div class="text-center mb-8"><span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide block max-w-[90%] mx-auto leading-relaxed">${item.judul_utama}</span></div>` : '';
            let headerCard = `${basmalahHtml}${garisHtml}${judulUtamaHtml}`;
            finalHtml += `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100 mb-6">${headerCard}<p class="font-arab mb-8 w-full text-right" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important; margin-bottom: 8px;">${tAr}</p>${tDet}</div>`;
        });
    } 
    else {
        let tLat = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; let tArt = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : ""; 
        let kt = ""; 
        if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
        if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
        
        const tDet = kt ? `<div class="mt-3 text-left mb-2"><button onclick="toggleTerjemahanMulti(this, 'doa-terj-single')" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="doa-terj-single" style="display: none;"><div class="w-full h-[1px] bg-slate-100 my-4"></div>${kt}</div>` : "";
        
        let tAr = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || ""); tAr = tAr.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1 font-sans font-bold text-teal-600 text-[0.8em]">﴿x$1﴾</span>');
        let basmalahHtml = d.judul ? `<div class="text-center mb-6"><h3 class="font-kufi text-lg text-teal-700 font-bold">${d.judul}</h3></div>` : `<div class="text-center mb-6"><h3 class="font-arab text-xl text-teal-600 leading-none" lang="ar" dir="rtl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3></div>`;
        let garisHtml = `<div class="w-full h-[1px] bg-slate-100 mb-6"></div>`; let judulUtamaHtml = d.judul_utama ? `<div class="text-center mb-8"><span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide block max-w-[90%] mx-auto leading-relaxed">${d.judul_utama}</span></div>` : '';
        let headerCard = `${basmalahHtml}${garisHtml}${judulUtamaHtml}`;
        finalHtml = `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100 mb-6">${headerCard}<p class="font-arab mb-8 w-full text-right" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important; margin-bottom: 8px;">${tAr}</p>${tDet}</div>`;
    }

    c.innerHTML = finalHtml;
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

window.toggleTerjemahanPanduanSholat = function() { const c = document.getElementById('panduan-sholat-terjemahan-container'); const b = document.getElementById('btn-toggle-terjemahan-panduan-sholat'); if (c.style.display === 'none') { c.style.display = 'block'; b.innerHTML = '<i class="fa-solid fa-book-quran"></i>'; } else { c.style.display = 'none'; b.innerHTML = '<i class="fa-solid fa-book"></i>'; } }

async function renderPanduanSholatDetailLogic(id) {
    const c = document.getElementById('panduan-sholat-content'); const idx = dataPanduanSholat.findIndex(i => i.id === id); const info = dataPanduanSholat[idx]; document.getElementById('panduan-sholat-header-title').innerText = info.judul; c.scrollTop = 0; document.getElementById('panduan-sholat-sticky-header').classList.remove('panduan-sholat-header-slim');
    let navHtml = ''; if (idx > 0) navHtml += `<button onclick="loadPanduanSholatDetail(${dataPanduanSholat[idx - 1].id})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-left"></i></button>`; if (idx < dataPanduanSholat.length - 1) navHtml += `<button onclick="loadPanduanSholatDetail(${dataPanduanSholat[idx + 1].id})" class="w-9 h-10 flex shrink-0 items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white active:scale-90 transition-all"><i class="fa-solid fa-chevron-right"></i></button>`; document.getElementById('panduan-sholat-nav-controls').innerHTML = navHtml;
  
    let d;
    const cacheKey = info.path;

    if (window.ramCache[cacheKey]) {
        d = window.ramCache[cacheKey];
    } else {
        c.innerHTML = window.getLoadingHtml("MEMUAT PANDUAN...");
        try { const res = await fetch(info.path); d = await res.json(); window.ramCache[cacheKey] = d; } 
        catch (e) { c.innerHTML = `<div class="text-center p-10"><i class="fa-solid fa-triangle-exclamation text-red-400 text-3xl mb-3"></i><p class="text-xs text-red-500 font-bold uppercase">Gagal memuat panduan</p></div>`; return; }
    }

    let tLat = d.latin ? (Array.isArray(d.latin) ? d.latin.join('<br><br>') : d.latin) : ""; let tArt = d.arti ? (Array.isArray(d.arti) ? d.arti.join('<br><br>') : d.arti) : ""; 
    let kt = ""; 
    if (tLat.trim() !== "" && tLat.trim() !== "-") kt += `<p class="latin-read-text text-teal-700 font-semibold mb-4 leading-relaxed text-justify">${tLat}</p>`; 
    if (tArt.trim() !== "" && tArt.trim() !== "-") kt += `<p class="translation-read-text text-slate-500 italic leading-relaxed text-justify">"${tArt}"</p>`; 
    
    const tDet = kt ? `<div class="mt-3 text-left mb-2"><button onclick="toggleTerjemahanPanduanSholat()" id="btn-toggle-terjemahan-panduan-sholat" class="w-8 h-8 inline-flex items-center justify-center bg-teal-50 border border-teal-100 rounded-xl shadow-sm active:scale-95 transition-transform text-teal-700"><i class="fa-solid fa-book"></i></button></div><div id="panduan-sholat-terjemahan-container" style="display: none;"><div class="w-full h-[1px] bg-slate-100 my-4"></div>${kt}</div>` : "";
    
    let tAr = Array.isArray(d.arab) ? d.arab.join(' ') : (d.arab || ""); tAr = tAr.replace(/۝?\s*([٠-٩]+)/g, '&nbsp;<span class="mx-1">﴿x$1﴾</span>');
    let basmalahHtml = d.judul ? `<div class="text-center mb-6"><h3 class="font-arab text-xl text-teal-600 leading-none" lang="ar" dir="rtl">${d.judul}</h3></div>` : `<div class="text-center mb-6"><h3 class="font-arab text-xl text-teal-600 leading-none" lang="ar" dir="rtl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h3></div>`;
    let garisHtml = `<div class="w-full h-[1px] bg-slate-100 mb-6"></div>`; let judulUtamaHtml = d.judul_utama ? `<div class="text-center mb-8"><span class="text-[10px] font-bold text-teal-700 uppercase tracking-wide block max-w-[90%] mx-auto leading-relaxed">${d.judul_utama}</span></div>` : '';
    let headerCard = `${basmalahHtml}${garisHtml}${judulUtamaHtml}`;
    
    c.innerHTML = `<div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100">${headerCard}<p class="font-arab mb-8" dir="rtl" lang="ar" style="font-size: calc(28px * var(--font-scale)) !important; font-size-adjust: none !important; word-spacing: normal !important; line-height: 2.4 !important;">${tAr}</p>${tDet}</div>`;
}

/* ==========================================================================
   PWA INSTALL PROMPT
   ========================================================================== */
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (localStorage.getItem('al_mukhtar_pwa_closed') !== 'true') {
        setTimeout(() => { if(installBanner) { installBanner.style.display = 'flex'; void installBanner.offsetWidth; installBanner.classList.add('show'); } }, 2000);
    }
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null; installBanner.classList.remove('show'); setTimeout(() => { installBanner.style.display = 'none'; }, 500);
        }
    });
}

if(closeBtn) { closeBtn.addEventListener('click', () => { installBanner.classList.remove('show'); setTimeout(() => { installBanner.style.display = 'none'; }, 500); localStorage.setItem('al_mukhtar_pwa_closed', 'true'); }); }

window.addEventListener('appinstalled', () => { if(installBanner) { installBanner.classList.remove('show'); setTimeout(() => { installBanner.style.display = 'none'; }, 500); } showToast("Aplikasi berhasil diinstal!", "success"); });

const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
if (isIos() && !isInStandaloneMode() && localStorage.getItem('al_mukhtar_pwa_closed') !== 'true') {
    setTimeout(() => {
        if(installBanner) {
            const pwaText = document.querySelector('.pwa-text p'); if(pwaText) pwaText.innerHTML = "Tap ikon <b>Share</b> <i class='fa-solid fa-arrow-up-from-bracket'></i> di bawah, lalu pilih <b>Add to Home Screen</b>.";
            if(installBtn) installBtn.style.display = 'none'; installBanner.style.display = 'flex'; void installBanner.offsetWidth; installBanner.classList.add('show');
        }
    }, 2500);
}

/* ==========================================================================
   AUTO-DOWNLOADER & QUOTES
   ========================================================================== */
async function downloadSemuaDataDiamDiam() {
    try {
        const response = await fetch('database.json'); 
        const data = await response.json(); 
        const kumpulanLink = [];
        
        function cariSemuaLink(obj) { 
            for (let kunci in obj) { 
                if (typeof obj[kunci] === 'object' && obj[kunci] !== null) { 
                    cariSemuaLink(obj[kunci]); 
                } else if (kunci === 'path' && typeof obj[kunci] === 'string') { 
                    kumpulanLink.push(obj[kunci]); 
                } 
            } 
        }
        cariSemuaLink(data);
        
        // Memasukkan 114 Surah Al-Qur'an ke antrean download
        for (let i = 1; i <= 114; i++) { 
            kumpulanLink.push(`quran/surah/${i}.json`); 
        }

        // ===============================================================
        // KODE BARU: Memasukkan File Fiqih ke Antrean Download Cache
        // ===============================================================
        kumpulanLink.push('datafiqih_full.json');

        // KODE BARU: Simpan langsung Fiqih ke LocalStorage di Background
        // Agar jika Service Worker HP mati, data tetap ada di memori HP
        fetch('datafiqih_full.json?v=' + new Date().getTime())
            .then(res => res.json())
            .then(fiqihData => {
                localStorage.setItem('al_mukhtar_fiqih_offline', JSON.stringify(fiqihData));
            }).catch(e => console.log("Sedot data Fiqih background gagal", e));
        // ===============================================================

        const asetDesainUtama = [ "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2", "https://fonts.googleapis.com/icon?family=Material+Icons+Outlined", "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Reem+Kufi:wght@500;700&display=block&subset=arabic" ];
        const semuaAntrean = [...asetDesainUtama, ...kumpulanLink]; 
        const cache = await caches.open("almukhtar-cache-v12");
        
        const sudahPernahSelesai = localStorage.getItem('al_mukhtar_offline_ready');
        if (!sudahPernahSelesai && typeof showToast === 'function') { showToast("Menyiapkan Data & Desain Offline...", "info"); }

        for (const url of semuaAntrean) {
            try {
                const sudahAda = await cache.match(url);
                if (!sudahAda) {
                    let ambilData = await fetch(url).catch(() => null);
                    if (!ambilData || !ambilData.ok) { ambilData = await fetch(url, { mode: 'no-cors' }).catch(() => null); }
                    if (ambilData && (ambilData.ok || ambilData.type === 'opaque')) { await cache.put(url, ambilData); }
                }
            } catch (err) { console.log("Gagal nyedot: " + url); }
        }

        if (!sudahPernahSelesai) {
            setTimeout(() => { if(typeof showToast === 'function') showToast("Aplikasi Siap 100% Offline!", "success"); localStorage.setItem('al_mukhtar_offline_ready', 'true'); }, 1000);
        }
    } catch (error) { console.log("Gagal melakukan auto-download: ", error); }
}

window.addEventListener('load', () => { if ('caches' in window) { setTimeout(downloadSemuaDataDiamDiam, 3000); } });

function tampilkanQuoteAcak() {
    const quotes = [
        "Hanya dengan mengingat Allah hati menjadi tenteram. (QS. Ar-Ra'd: 28)", "Perumpamaan orang yang mengingat Tuhannya dan yang tidak, seperti orang yang hidup dan yang mati. (HR. Bukhari)", "Tiada waktu yang disesali oleh penghuni surga, kecuali waktu di dunia yang berlalu tanpa dzikir kepada Allah.", "Dzikir adalah surga dunia. Barangsiapa belum memasukinya, ia tidak akan memasuki surga akhirat. (Ibn Taimiyyah)", "Banyak mengingat manusia adalah penyakit, sedangkan banyak mengingat Allah adalah obat. (Umar bin Khattab)", "Jangan berhenti berdzikir walaupun hatimu belum hadir, karena kelalaian tanpa dzikir lebih buruk. (Ibn Atha'illah)", "Dosa itu menghancurkan hati, dan dzikir adalah penawarnya.", "Setiap nafas yang dihembuskan tanpa mengingat Allah adalah sebuah kerugian yang nyata.", "Barangsiapa bershalawat kepadaku satu kali, Allah akan bershalawat kepadanya sepuluh kali. (HR. Muslim)", "Dzikir yang paling utama adalah 'Laa ilaaha illallaah'. (HR. Tirmidzi)",
        "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.", "Jangan pernah meremehkan kebaikan sekecil apapun, walau hanya tersenyum ketika bertemu saudaramu. (HR. Muslim)", "Amalan yang paling dicintai Allah adalah amalan yang berkesinambungan (istiqamah) walaupun sedikit. (HR. Bukhari)", "Barangsiapa menunjukkan suatu kebaikan, maka ia mendapatkan pahala seperti orang yang melakukannya. (HR. Muslim)", "Sedekah tidak akan mengurangi harta. (HR. Muslim)", "Orang yang kuat bukanlah yang pandai bergulat, tapi yang bisa menahan amarahnya. (HR. Bukhari)", "Sembunyikanlah kebaikanmu sebagaimana engkau menyembunyikan keburukanmu.", "Balasan kebaikan tidak lain hanyalah kebaikan pula. (QS. Ar-Rahman: 60)", "Kebaikan sejati adalah berbuat baik kepada orang yang pernah berbuat buruk kepadamu.", "Akhlak yang mulia adalah seberat-berat timbangan di hari kiamat.",
        "Sesungguhnya bersama kesulitan ada kemudahan. (QS. Al-Insyirah: 6)", "Janganlah kamu bersedih, sesungguhnya Allah bersama kita. (QS. At-Taubah: 40)", "Apa yang melewatkanmu tidak akan pernah menjadi takdirmu, dan apa yang ditakdirkan untukmu tidak akan pernah melewatkanmu.", "Jika Allah menolong kamu, maka tak adalah orang yang dapat mengalahkan kamu. (QS. Ali 'Imran: 160)", "Sabar itu ada dua: Sabar terhadap apa yang kau benci, dan sabar terhadap apa yang kau sukai. (Ali bin Abi Thalib)", "Terkadang Allah mematahkan rencanamu untuk menyelamatkan dirimu.", "Barangsiapa yang bertakwa kepada Allah, niscaya Dia akan memberikan jalan keluar. (QS. At-Thalaq: 2)", "Syukuri apa yang kau miliki, maka Allah akan menambahkan apa yang kau butuhkan.", "Tidak ada musibah yang menimpa seorang muslim kecuali Allah menjadikannya penebus dosa-dosanya. (HR. Bukhari)", "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya. (QS. Al-Baqarah: 286)",
        "Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah mudahkan baginya jalan ke surga. (HR. Muslim)", "Ilmu tanpa amal adalah kegilaan, dan amal tanpa ilmu adalah kesia-siaan. (Imam Al-Ghazali)", "Dua nikmat yang sering dilalaikan manusia: Kesehatan dan waktu luang. (HR. Bukhari)", "Waktu itu bagaikan pedang. Jika kau tidak memotongnya, maka ia akan memotongmu. (Imam Syafi'i)", "Sampaikanlah dariku walau hanya satu ayat. (HR. Bukhari)", "Bukanlah ilmu itu apa yang dihafal, melainkan apa yang memberi manfaat. (Imam Syafi'i)", "Ilmu adalah sebaik-baik warisan, dan adab adalah sebaik-baik kerajinan.", "Tuntutlah ilmu dari buaian hingga liang lahat.",
        "Doa adalah senjatanya orang mukmin, tiang agama, dan cahaya langit serta bumi. (HR. Al-Hakim)", "Tidak ada yang dapat menolak takdir kecuali doa. (HR. Tirmidzi)", "Hati yang hancur karena Allah, adalah hati yang sedang dibangun ulang oleh-Nya.", "Bila engkau memohon, mohonlah kepada Allah. Bila engkau meminta pertolongan, mintalah kepada Allah.", "Air mata orang yang bertobat lebih dicintai Allah daripada tasbih orang yang sombong.", "Jangan putus asa dari rahmat Allah. Sesungguhnya Allah mengampuni dosa-dosa semuanya. (QS. Az-Zumar: 53)", "Jadikanlah sabar dan shalat sebagai penolongmu. (QS. Al-Baqarah: 45)", "Dunia ini adalah perhiasan, dan seindah-indah perhiasan dunia adalah wanita (istri) yang shalihah. (HR. Muslim)", "Cukuplah Allah menjadi Penolong kami, dan Allah adalah sebaik-baik Pelindung. (QS. Ali 'Imran: 173)", "Kejujuran itu membawa ketenangan, sedangkan dusta membawa keragu-raguan. (HR. Tirmidzi)", "Perbaikilah hubunganmu dengan Allah, maka Allah akan memperbaiki hubunganmu dengan manusia.", "Barangsiapa yang rida dengan ketetapan Allah, maka Allah rida kepadanya."
    ];
    const quoteElement = document.getElementById('app-quote');
    if (quoteElement) { const randomIndex = Math.floor(Math.random() * quotes.length); quoteElement.innerText = `"${quotes[randomIndex]}"`; }
}

window.shareTafsir = function() {
    const title = document.getElementById('tafsir-title').innerText;
    const bodyText = document.getElementById('tafsir-body').innerText;
    const textToShare = `${title}\n\n${bodyText}\n\n~ Al-Mukhtar Digital Library`;

    // 1. Coba fitur Share bawaan HP (paling stabil untuk teks panjang)
    if (navigator.share) {
        navigator.share({
            title: title,
            text: textToShare
        }).catch((err) => {
            // Jika user membatalkan atau share gagal, fallback ke WhatsApp
            shareViaWhatsApp(textToShare);
        });
    } else {
        // 2. Jika tidak ada navigator.share, langsung ke WhatsApp
        shareViaWhatsApp(textToShare);
    }
}

// Fungsi bantu agar kodenya lebih rapi
function shareViaWhatsApp(text) {
    // Menggunakan encodeURIComponent untuk menangani teks panjang dengan aman
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    // Gunakan window.open dengan target _blank agar tidak terblokir di WebView APK
    const win = window.open(waUrl, '_blank');
    if (!win) {
        // Jika tetap diblokir, tawarkan Copy ke Clipboard
        navigator.clipboard.writeText(text).then(() => {
            showToast("Tafsir disalin ke clipboard karena tidak bisa dibagikan langsung", "info");
        });
    }
}

/* ==========================================================================
   MESIN AI CHATBOT (GEMINI API BERGAYA NU ONLINE VIA CLOUDFLARE)
   ========================================================================== */

// 1. FUNGSI NAVIGASI MODAL AI (MEMBUKA & MENUTUP JENDELA CHAT)
window.toggleAi = function() {
    const el = document.getElementById('ai-modal'); //
    if (!el.classList.contains('modal-show')) { //
        const wasOpen = document.querySelectorAll('.modal-show').length > 0; //
        closeAllModals(); //
        if (!isPopping) { //
            if (wasOpen) history.replaceState({ modal: 'ai' }, '', '#ai'); //
            else history.pushState({ modal: 'ai' }, '', '#ai'); //
        }
        el.classList.add('modal-show'); //
        checkZoomBtnVisibility(); //
        
        // Sembunyikan menu navigasi bawah agar chat terlihat penuh
        const bNav = document.querySelector('.bottom-nav'); //
        if(bNav) bNav.style.display = 'none'; //
        
    } else { //
        goBackAi(); //
    }
}

window.goBackAi = function() {
    if (!isPopping) { history.back(); return; } //
    document.getElementById('ai-modal').classList.remove('modal-show'); //
    resetNavToBeranda(); //
    checkZoomBtnVisibility(); //
    
    // Munculkan kembali menu navigasi bawah saat keluar dari menu AI
    const bNav = document.querySelector('.bottom-nav'); //
    if(bNav) bNav.style.display = 'flex'; //
}

// 2. SISTEM OTOMATIS PELEBARAN KOTAK INPUT CHAT (AUTO-RESIZE TEXTAREA)
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('ai-chat-input'); //
    if(chatInput) { //
        chatInput.addEventListener('input', function() { //
            this.style.height = 'auto'; //
            this.style.height = (this.scrollHeight) + 'px'; //
        });
    }
});

// Variabel global untuk mengontrol pembatalan request pesan
let currentController = null; //

// 3. FUNGSI UTAMA PENGIRIMAN PESAN (VERSI PUNCAK: ANTI-CRASH & MEMORI CERDAS)

// Array global memori percakapan
let aiChatHistory = [];

window.sendMessageAi = async function() {
    const inputEl = document.getElementById('ai-chat-input');
    const btnEl = document.getElementById('btn-send-ai');
    const chatContent = document.getElementById('ai-chat-content');
    const message = inputEl.value.trim();

    if (btnEl.dataset.mode === 'stop') {
        if (currentController) {
            currentController.abort();
            currentController = null;
        }
        resetButtonMode();
        appendMessageAi('ai', "_Ananda, jawaban Ustaz dihentikan sementara._");
        return;
    }

    if (!message) return;

    // Kunci tombol agar user tidak spam klik
    if (aiChatHistory.length > 0 && aiChatHistory[aiChatHistory.length - 1].role === "user") return;

    appendMessageAi('user', message);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    setButtonMode('stop');
    
    const typingId = 'typing-' + Date.now();
    appendTypingIndicatorAi(typingId);
    chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });

    currentController = new AbortController();

    // Simpan pesan user
    aiChatHistory.push({ role: "user", parts: [{ text: message }] });

    // Ambil maksimal 10 obrolan terakhir agar beban jaringan sangat ringan
    let historyToSend = aiChatHistory.slice(-10);

    try {
        // URL API RAG Ustaz AI Baru (Menggunakan GET)
        const CLOUDFLARE_URL = `https://ustaz-ai-rag.aromkeyapi.workers.dev/?q=${encodeURIComponent(message)}`;
        
        const response = await fetch(CLOUDFLARE_URL, {
            method: 'GET',
            signal: currentController.signal
        });

        // Karena API baru kita langsung mengembalikan teks murni, gunakan .text()
        const rawAiText = await response.text();
        removeTypingIndicatorAi(typingId);

        // Jika error dari server
        if (!response.ok || rawAiText.includes("Terjadi kesalahan") || rawAiText.includes("Terjadi kendala")) {
            appendMessageAi('ai', `⏳ Afwan Ananda, pusat keilmuan sedang sibuk: ${rawAiText}`);
            aiChatHistory.pop(); // Mundurkan memori otomatis
            return;
        }

        // Jika teks kosong
        if (!rawAiText || rawAiText.trim() === "") {
            appendMessageAi('ai', "Maaf Ananda, Ustaz belum menemukan jawaban. Silakan ulangi kembali.");
            aiChatHistory.pop();
            return;
        }
            
        // Simpan ke memori permanen
        aiChatHistory.push({ role: "model", parts: [{ text: rawAiText }] });

        let aiResponseText = rawAiText;
        // Percantik teks Arab dan Format Miring/Tebal
        const arabicRegex = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\s]+)/g;
        aiResponseText = aiResponseText.replace(arabicRegex, match => {
            if (match.trim().length === 0 || !/[\u0600-\u06FF]/.test(match)) return match;
            return `<div dir="rtl" lang="ar" class="font-arab w-full">${match.trim()}</div>`;
        });

        aiResponseText = aiResponseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        aiResponseText = aiResponseText.replace(/\*(.*?)\*/g, '<em class="text-slate-500">$1</em>');
        aiResponseText = aiResponseText.replace(/\n/g, '<br>');
        aiResponseText = aiResponseText.replace(/<\/div><br>/g, '</div>');

        appendMessageAi('ai', aiResponseText);
        
    } catch (error) {
        removeTypingIndicatorAi(typingId);
        aiChatHistory.pop(); // Wajib buang riwayat terakhir jika gagal agar chat tetap bisa jalan

        if (error.name !== 'AbortError') {
             appendMessageAi('ai', "🚨 <strong>Koneksi Kurang Stabil:</strong> Mohon tunggu beberapa saat, lalu kirim ulang pertanyaan Ananda.");
        }
    } finally {
        resetButtonMode();
        inputEl.focus();
    }
};

// 4. FUNGSI PENDUKUNG (TAMPILAN TOMBOL, BUBBLE CHAT & INDIKATOR KETIK)
function setButtonMode(mode) {
    const btn = document.getElementById('btn-send-ai'); //
    if (mode === 'stop') { //
        btn.dataset.mode = 'stop'; //
        btn.classList.replace('bg-teal-600', 'bg-red-600'); //
        btn.innerHTML = '<i class="fa-solid fa-stop"></i>'; //
    }
}

function resetButtonMode() {
    const btn = document.getElementById('btn-send-ai'); //
    btn.dataset.mode = 'send'; //
    btn.classList.replace('bg-red-600', 'bg-teal-600'); //
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; //
}

function appendMessageAi(sender, text) {
    const chatContent = document.getElementById('ai-chat-content'); //
    const div = document.createElement('div');
    
    if (sender === 'user') {
        div.className = 'chat-bubble-user cursor-pointer'; // Ditambah kursor agar terlihat bisa diklik
        div.title = 'Tap/Klik untuk mengedit pesan ini'; // Ditambah petunjuk/tooltip
        div.innerText = text; //
        
        // FUNGSI BARU: Jika pesan diklik, jalankan fitur Edit (Mesin Waktu)
        div.onclick = function() { 
            window.editUserMessage(this, text); 
        };
        
        chatContent.appendChild(div);
    } else {
        div.className = 'chat-bubble-ai'; //
        chatContent.appendChild(div);
        
        let i = 0;
        let isTag = false;
        let currentText = "";
        let typingSpeed = 10; //

        function typeWriter() {
            if (i < text.length) {
                let char = text.charAt(i);
                currentText += char;
                if (char === '<') isTag = true;
                if (char === '>') isTag = false;
                div.innerHTML = currentText;
                i++;
                if (i % 4 === 0) chatContent.scrollTop = chatContent.scrollHeight; //
                if (isTag) typeWriter();
                else setTimeout(typeWriter, typingSpeed);
            } else {
                chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' }); //
            }
        }
        typeWriter();
    }
}

// ==========================================================================
// FITUR BARU: MENGEDIT PESAN USER (GAYA CHATGPT)
// ==========================================================================
window.editUserMessage = function(bubbleElement, originalText) {
    const btnEl = document.getElementById('btn-send-ai');
    
    // Jangan izinkan edit jika AI sedang memproses jawaban (tombol masih merah)
    if (btnEl.dataset.mode === 'stop') return;

    // 1. Kembalikan teks yang salah ke dalam kotak ketik
    const inputEl = document.getElementById('ai-chat-input');
    inputEl.value = originalText;
    inputEl.style.height = 'auto';
    inputEl.style.height = (inputEl.scrollHeight) + 'px';
    inputEl.focus();

    // 2. Hapus pesan yang diklik beserta SEMUA percakapan di bawahnya (Mesin Waktu mundur)
    let nextSibling = bubbleElement.nextElementSibling;
    while (nextSibling) {
        let toRemove = nextSibling;
        nextSibling = nextSibling.nextElementSibling;
        toRemove.remove();
    }
    bubbleElement.remove();

    // 3. Sinkronisasi ulang ingatan AI (aiChatHistory) agar pas dengan layar yang tersisa
    aiChatHistory = [];
    const remainingBubbles = document.querySelectorAll('#ai-chat-content > div');
    remainingBubbles.forEach(b => {
        if (b.classList.contains('chat-bubble-user')) {
            aiChatHistory.push({ role: "user", parts: [{ text: b.innerText }] });
        } else if (b.classList.contains('chat-bubble-ai') && !b.innerText.includes('Koneksi') && !b.innerText.includes('Afwan') && !b.innerText.includes('Maaf')) {
            // Hanya masukkan memori jawaban AI yang sukses
            aiChatHistory.push({ role: "model", parts: [{ text: b.innerText }] });
        }
    });
}

function appendTypingIndicatorAi(id) {
    const chatContent = document.getElementById('ai-chat-content'); //
    const div = document.createElement('div');
    div.id = id; //
    div.className = 'chat-bubble-ai flex items-center justify-center py-3'; //
    div.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>'; //
    chatContent.appendChild(div);
}

function removeTypingIndicatorAi(id) {
    const el = document.getElementById(id); //
    if(el) el.remove(); //
}

// 5. FUNGSI SHARE (MEMBAGIKAN RINGKASAN OBROLAN KE WHATSAPP)
window.shareChatConversations = function() {
    const chatContent = document.getElementById('ai-chat-content'); //
    if (!chatContent) return; //

    const bubbles = chatContent.querySelectorAll('.chat-bubble-user, .chat-bubble-ai'); //
    let textToShare = "*📢 RANGKUMAN TANYA JAWAB USTAZ AI*\n\n";
    let adaPercakapan = false;

    bubbles.forEach((bubble, index) => {
        if (index === 0 && bubble.classList.contains('chat-bubble-ai')) return; //
        if (bubble.classList.contains('chat-bubble-user')) {
            textToShare += `❓ *Tanya:* ${bubble.innerText}\n`; //
        } else if (bubble.classList.contains('chat-bubble-ai')) {
            textToShare += `✅ *Jawab:* ${bubble.innerText}\n\n`; //
            adaPercakapan = true; //
        }
    });

    textToShare += "_Referensi dirangkum via Aplikasi Al-Mukhtar Digital Library_"; //

    if (!adaPercakapan) {
        showToast("Belum ada obrolan hukum yang bisa dibagikan.", "info"); //
        return;
    }

    if (navigator.share) {
        navigator.share({ title: 'Rangkuman Tanya Jawab Al-Mukhtar AI', text: textToShare }) //
        .catch((err) => console.log('Batal berbagi:', err)); //
    } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`; //
        window.open(waUrl, '_blank'); //
    }
}

// OTOMATIS BERSIHKAN RIWAYAT CHAT SAAT RUANG CHAT DITUTUP (Agar memori HP jamaah lega kembali)
const originalGoBackAi = window.goBackAi;
window.goBackAi = function() {
    originalGoBackAi();
    aiChatHistory = []; // Reset memori chat ke kosong
}