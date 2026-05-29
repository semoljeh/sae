const baseUrl = 'https://equran.id/api/v2';
let currentTab = 'surah';
let currentSurahAudioFull = null;
window.ayatData = {}; 
let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];

// Fungsi Pengubah Angka Latin ke Arab
function toArabicNum(num) {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(n => arabicNumbers[n]).join('');
}

const juzMapping = [
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

document.addEventListener("DOMContentLoaded", () => {
    loadSurahList();
});

function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `modern-toast ${type}`;
    toast.innerText = (type === 'success' ? '✓ ' : (type === 'error' ? '✕ ' : 'ℹ ')) + message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastExit 0.4s forwards';
        setTimeout(() => toast.remove(), 400); 
    }, 2000);
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-surah').classList.remove('active');
    document.getElementById('tab-juz').classList.remove('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    if (tab === 'surah') loadSurahList();
    else loadJuzList();
}

// --- RENDER DAFTAR KE HALAMAN UTAMA ---
async function loadSurahList() {
    const listDiv = document.getElementById('list-container');
    listDiv.innerHTML = '<div class="loading-state">Memuat daftar Surah...</div>';
    try {
        const response = await fetch(`${baseUrl}/surat`);
        const json = await response.json();
        let html = '';
        json.data.forEach(surah => {
            html += `
                <div class="list-card" onclick="openDetail('surah', ${surah.nomor}, '${surah.namaLatin}')">
                    <div class="card-left">
                        <div class="num-circle">${surah.nomor}</div>
                        <div class="surah-info">
                            <div class="surah-name">${surah.namaLatin}</div>
                            <div class="surah-meaning">${surah.arti}</div>
                        </div>
                    </div>
                    <div class="card-right">
                        <div class="surah-arabic">${surah.nama}</div>
                        <div class="num-circle" style="font-family:'Amiri Quran',serif; font-size:16px;">${toArabicNum(surah.nomor)}</div>
                    </div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    } catch (error) {
        listDiv.innerHTML = '<div class="loading-state" style="color:red;">Gagal memuat data.</div>';
    }
}

function loadJuzList() {
    const listDiv = document.getElementById('list-container');
    let html = '';
    for (let i = 1; i <= 30; i++) {
        html += `
            <div class="list-card" onclick="openDetail('juz', ${i}, 'Juz ${i}')">
                <div class="card-left">
                    <div class="num-circle">${i}</div>
                    <div class="surah-info">
                        <div class="surah-name">JUZ ${i}</div>
                        <div class="surah-meaning">Kumpulan Surah/Ayat</div>
                    </div>
                </div>
                <div class="card-right">
                    <div class="num-circle" style="font-family:'Amiri Quran',serif; font-size:16px;">${toArabicNum(i)}</div>
                </div>
            </div>
        `;
    }
    listDiv.innerHTML = html;
}

// --- FUNGSI PINDAH HALAMAN (MASTER-DETAIL) ---
async function openDetail(type, id, title) {
    document.getElementById('detail-screen').style.display = 'flex';
    setTimeout(() => document.getElementById('detail-screen').classList.add('open'), 10);
    
    document.getElementById('detail-title').innerText = title;
    document.getElementById('detail-settings').style.display = type === 'surah' ? 'block' : 'none';
    
    const contentDiv = document.getElementById('detail-content');
    contentDiv.innerHTML = '<div class="loading-state">Mengambil ayat...</div>';
    window.ayatData = {}; 

    try {
        if (type === 'surah') await renderSurah(id, contentDiv);
        else await renderJuz(id, contentDiv);
    } catch (e) {
        contentDiv.innerHTML = '<div class="loading-state" style="color:red;">Koneksi terputus.</div>';
    }
}

function closeDetail() {
    const mainAudio = document.getElementById('surah-audio');
    const perAudio = document.getElementById('per-ayat-audio');
    if(mainAudio) mainAudio.pause();
    if(perAudio) perAudio.pause();

    document.getElementById('detail-screen').classList.remove('open');
    setTimeout(() => {
        document.getElementById('detail-screen').style.display = 'none';
        document.getElementById('detail-content').innerHTML = '';
    }, 300);
}

function changeQari(selectElement) {
    const audioPlayer = document.getElementById('surah-audio');
    const audioSource = document.getElementById('audio-source');
    const isPlaying = !audioPlayer.paused && !audioPlayer.ended && audioPlayer.readyState > 2;

    audioSource.src = currentSurahAudioFull[selectElement.value];
    audioPlayer.load(); 
    if (isPlaying) audioPlayer.play();
}

// --- LOGIKA RENDER AYAT ---
async function renderSurah(nomorSurah, container) {
    const response = await fetch(`${baseUrl}/surat/${nomorSurah}`);
    const json = await response.json();
    const surah = json.data;
    currentSurahAudioFull = surah.audioFull;

    document.getElementById('audio-source').src = currentSurahAudioFull['05'];
    document.getElementById('surah-audio').load();
    document.getElementById('qari-select').value = '05';

    // Desain Header Baru (Bingkai Emas)
    let html = `
        <div class="surah-separator" style="margin-top:0;">
            <div class="surah-frame">
                <div class="surah-frame-inner">
                    <div class="surah-badge">${surah.tempatTurun}</div>
                    <div class="surah-arabic-name">${surah.nama}</div>
                    <div class="surah-badge">${surah.jumlahAyat} Ayat</div>
                </div>
            </div>
    `;
    
    // Tambahkan Bismillah kecuali untuk Al-Fatihah (1) dan At-Tawbah (9)
    if (surah.nomor !== 1 && surah.nomor !== 9) {
        html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
    }
    
    html += `</div>`; // Tutup div separator

    surah.ayat.forEach(ayat => {
        html += createAyatCard(ayat, surah.nomor);
    });
    container.innerHTML = html;
}

async function renderJuz(nomorJuz, container) {
    const juzInfo = juzMapping[nomorJuz - 1];
    let fetchPromises = [];
    for (let s = juzInfo.start.s; s <= juzInfo.end.s; s++) {
        fetchPromises.push(fetch(`${baseUrl}/surat/${s}`).then(r => r.json()));
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
            // Jika ayat dimulai dari ayat 1, tampilkan bingkai emas
            if (mulaiAyat === 1) {
                html += `
                    <div class="surah-separator">
                        <div class="surah-frame">
                            <div class="surah-frame-inner">
                                <div class="surah-badge">${surah.tempatTurun}</div>
                                <div class="surah-arabic-name">${surah.nama}</div>
                                <div class="surah-badge">${surah.jumlahAyat} Ayat</div>
                            </div>
                        </div>
                `;
                // Logika Bismillah (Tidak untuk Al-Fatihah dan At-Tawbah)
                if (surah.nomor !== 1 && surah.nomor !== 9) {
                    html += `<div class="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>`;
                }
                html += `</div>`;
            } else {
                // Jika lanjutan dari Juz sebelumnya, gunakan badge sederhana
                html += `
                    <div class="juz-continue-header">
                        Melanjutkan Surah ${surah.namaLatin} (Ayat ${mulaiAyat})
                    </div>
                `;
            }

            ayats.forEach(ayat => {
                html += createAyatCard(ayat, surah.nomor);
            });
        }
    });
    container.innerHTML = html;
}

function createAyatCard(ayat, nomorSurah) {
    const uniqueKey = `${nomorSurah}_${ayat.nomorAyat}`;
    window.ayatData[uniqueKey] = ayat;
    const isBookmarked = bookmarks.includes(uniqueKey) ? 'bookmark-active' : '';

    return `
        <div class="ayat-card">
            <div class="action-bar">
                <div class="num-circle" style="width:34px; height:34px; margin-right:5px;">${ayat.nomorAyat}</div>
                
                <button class="action-btn play-btn" onclick="playAyat('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                
                <button id="bm-btn-${uniqueKey}" class="action-btn ${isBookmarked}" onclick="bookmarkAyat('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                </button>
                
                <button class="action-btn" onclick="showTafsir('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                </button>
                
                <button class="action-btn" onclick="copyAyat('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                
                <button class="action-btn" onclick="shareAyat('${nomorSurah}', '${ayat.nomorAyat}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
            </div>
            
            <div class="ayat-arabic">${ayat.teksArab}</div>
            <div class="ayat-translation">${ayat.teksIndonesia}</div>
        </div>
    `;
}

// --- FUNGSI TOMBOL AKSI ---
function playAyat(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    let qariKey = '05'; 
    const qariSelect = document.getElementById('qari-select');
    if (qariSelect && currentTab === 'surah') qariKey = qariSelect.value;

    const audioEl = document.getElementById('per-ayat-audio');
    const mainAudio = document.getElementById('surah-audio');
    if(mainAudio) mainAudio.pause();

    audioEl.src = ayat.audio[qariKey];
    audioEl.play().catch(e => showNotification("Gagal memutar ayat.", "error"));
}

function copyAyat(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    const textToCopy = `${ayat.teksArab}\n\n${ayat.teksIndonesia}\n(QS. ${nomorSurah}:${nomorAyat})`;
    navigator.clipboard.writeText(textToCopy).then(() => showNotification(`Ayat ke-${nomorAyat} disalin!`, 'success'));
}

function shareAyat(nomorSurah, nomorAyat) {
    const ayat = window.ayatData[`${nomorSurah}_${nomorAyat}`];
    if (navigator.share) {
        navigator.share({ title: `QS. ${nomorSurah}:${nomorAyat}`, text: `${ayat.teksArab}\n\n${ayat.teksIndonesia}` }).catch(console.error);
    } else {
        showNotification('Fitur Share belum didukung.', 'info');
    }
}

function bookmarkAyat(nomorSurah, nomorAyat) {
    const uniqueKey = `${nomorSurah}_${nomorAyat}`;
    const btnElement = document.getElementById(`bm-btn-${uniqueKey}`);
    const index = bookmarks.indexOf(uniqueKey);

    if (index > -1) {
        bookmarks.splice(index, 1);
        btnElement.classList.remove('bookmark-active');
        showNotification(`Dihapus dari Penanda`, 'info');
    } else {
        bookmarks.push(uniqueKey);
        btnElement.classList.add('bookmark-active');
        showNotification(`Berhasil ditandai!`, 'success');
    }
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
}

async function showTafsir(nomorSurah, nomorAyat) {
    const modal = document.getElementById('tafsir-modal');
    const modalContent = modal.querySelector('.modal-content');
    document.getElementById('tafsir-title').innerText = `Tafsir QS. ${nomorSurah}:${nomorAyat}`;
    const bodyText = document.getElementById('tafsir-body');
    
    modal.style.display = 'flex';
    setTimeout(() => { modal.style.opacity = '1'; modalContent.style.transform = 'translateY(0)'; }, 10);
    bodyText.innerHTML = '<div class="loading-state">Mengambil Tafsir...</div>';
    
    try {
        const response = await fetch(`${baseUrl}/tafsir/${nomorSurah}`);
        const json = await response.json();
        const dataTafsir = json.data.tafsir.find(t => t.ayat == nomorAyat);
        
        if (dataTafsir) {
            let textRaw = dataTafsir.teks.replace(/(\d+)\.([a-zA-Z])/g, '$1. $2').replace(/(^|\n)([a-z])\.([a-zA-Z])/g, '$1$2. $3');
            bodyText.innerHTML = textRaw.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p.trim()}</p>`).join('');
        } else {
            bodyText.innerHTML = '<p>Data tafsir tidak ditemukan.</p>';
        }
    } catch (error) {
        bodyText.innerHTML = '<p style="color:red; text-align:center;">Gagal terhubung ke server Tafsir.</p>';
    }
}

function closeTafsir() {
    const modal = document.getElementById('tafsir-modal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

document.getElementById('tafsir-modal').addEventListener('click', function(e) {
    if (e.target === this) closeTafsir();
});