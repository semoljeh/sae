
// =========================================
// 1. SIMPLE INTERACTION
// =========================================

const menuCards =
document.querySelectorAll('.menu-card');

menuCards.forEach(card=>{

    card.addEventListener('click',()=>{

        card.style.transform='scale(.95)';

        setTimeout(()=>{

            card.style.transform='';

        },150);

    });

});



function openDzikir(){

    document
    .getElementById('dzikirSheet')
    .classList.add('active');

    document
    .getElementById('sheetOverlay')
    .classList.add('active');


document.body.classList.add('no-scroll');

    history.pushState(
        {dzikir:true},
        ''
    );

}

/* =========================================
  2. DZIKIR SHEET
========================================= */


function closeDzikir(){

    const sheet =
    document.getElementById('dzikirSheet');

    const overlay =
    document.getElementById('sheetOverlay');

    /* TUTUP SHEET */

    sheet.classList.remove('active');

    overlay.classList.remove('active');

    /* RESET ACCORDION */

    const accordions =
    sheet.querySelectorAll('.accordion');

    accordions.forEach(item=>{

        item.classList.remove('active');

    });
	

document.body.classList.remove('no-scroll');


}


/* =========================================
   ACCORDION
========================================= */

document.addEventListener('DOMContentLoaded',()=>{

    const accordions =
    document.querySelectorAll('.accordion');

    accordions.forEach(item=>{

        const header =
        item.querySelector('.accordion-header');

        if(!header) return;

        header.addEventListener('click',()=>{

            if(item.classList.contains('single')){

                return;

            }

            accordions.forEach(other=>{

                if(other !== item){

                    other.classList.remove('active');

                }

            });

            item.classList.toggle('active');

        });

    });

});


/* =========================================
   BACK BUTTON HP
========================================= */

window.addEventListener('popstate',()=>{

    const sheet =
    document.getElementById('dzikirSheet');

    if(sheet.classList.contains('active')){

        closeDzikir();

    }

});


/* =========================================
   MAULID SHEET
========================================= */

function openMaulid(){

    document
    .getElementById('maulidSheet')
    .classList.add('active');

    document
    .getElementById('maulidOverlay')
    .classList.add('active');

document.body.classList.add('no-scroll');

    history.pushState(
        {maulid:true},
        ''
    );

}


function closeMaulid(){

    const sheet =
    document.getElementById('maulidSheet');

    const overlay =
    document.getElementById('maulidOverlay');

    /* TUTUP SHEET */

    sheet.classList.remove('active');

    overlay.classList.remove('active');

    /* RESET ACCORDION */

    const accordions =
    sheet.querySelectorAll('.accordion');

    accordions.forEach(item=>{

        item.classList.remove('active');

    });
	

document.body.classList.remove('no-scroll');


}

/* =========================================
   BACK BUTTON MAULID
========================================= */

window.addEventListener('popstate',()=>{

    const sheet =
    document.getElementById('maulidSheet');

    if(sheet.classList.contains('active')){

        sheet.classList.remove('active');

        document
        .getElementById('maulidOverlay')
        .classList.remove('active');

    }

});


/* =========================================
   RATIB SHEET
========================================= */

function openRatib(){

    document
    .getElementById('ratibSheet')
    .classList.add('active');

    document
    .getElementById('ratibOverlay')
    .classList.add('active');

    history.pushState(
        {ratib:true},
        ''
    );

}

function closeRatib(){

    document
    .getElementById('ratibSheet')
    .classList.remove('active');

    document
    .getElementById('ratibOverlay')
    .classList.remove('active');

    if(history.state?.ratib){

        history.back();

    }

}

/* =========================================
   BACK BUTTON RATIB
========================================= */

window.addEventListener('popstate',()=>{

    const sheet =
    document.getElementById('ratibSheet');

    if(sheet.classList.contains('active')){

        sheet.classList.remove('active');

        document
        .getElementById('ratibOverlay')
        .classList.remove('active');

    }

});


/* =========================================
   SHOLAWAT SHEET
========================================= */

function openSholawat(){

    document
    .getElementById('sholawatSheet')
    .classList.add('active');

    document
    .getElementById('sholawatOverlay')
    .classList.add('active');

    history.pushState(
        {sholawat:true},
        ''
    );

}

function closeSholawat(){

    document
    .getElementById('sholawatSheet')
    .classList.remove('active');

    document
    .getElementById('sholawatOverlay')
    .classList.remove('active');

    if(history.state?.sholawat){

        history.back();

    }

}

/* =========================================
   BACK BUTTON SHOLAWAT
========================================= */

window.addEventListener('popstate',()=>{

    const sheet =
    document.getElementById('sholawatSheet');

    if(sheet.classList.contains('active')){

        sheet.classList.remove('active');

        document
        .getElementById('sholawatOverlay')
        .classList.remove('active');

    }

});
