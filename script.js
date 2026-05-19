document.addEventListener("DOMContentLoaded", function () {
    const infoButton = document.getElementById("info-button");
    const popupBox = document.getElementById("popup-box");
    const popupBackdrop = document.getElementById("popup-backdrop");

    // Fungsi untuk membuka/menutup popup
    function togglePopup() {
        popupBox.classList.toggle("active");
        popupBackdrop.classList.toggle("active");
    }

    // Event saat tombol 'i' diklik
    infoButton.addEventListener("click", togglePopup);

    // Event saat backdrop transparan diklik (menutup popup)
    popupBackdrop.addEventListener("click", togglePopup);
});
