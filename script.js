// =========================================
// SIMPLE INTERACTION
// =========================================

const menuCards =
document.querySelectorAll('.menu-card');

menuCards.forEach(card=>{

    card.addEventListener('click',()=>{

        card.style.transform =
        'scale(.95)';

        setTimeout(()=>{

            card.style.transform =
            '';

        },150);

    });

});


/* =========================================
   DZIKIR SHEET
========================================= */

function openDzikir(){

    const sheet =
    document.getElementById(
        'dzikirSheet'
    );

    const overlay =
    document.getElementById(
        'sheetOverlay'
    );

    sheet.classList.add(
        'active'
    );

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'no-scroll'
    );

    history.pushState(
        {sheet:'dzikir'},
        ''
    );

}


function closeDzikir(){

    const sheet =
    document.getElementById(
        'dzikirSheet'
    );

    const overlay =
    document.getElementById(
        'sheetOverlay'
    );

    sheet.classList.remove(
        'active'
    );

    overlay.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'no-scroll'
    );

}


/* =========================================
   MAULID SHEET
========================================= */

function openMaulid(){

    const sheet =
    document.getElementById(
        'maulidSheet'
    );

    const overlay =
    document.getElementById(
        'maulidOverlay'
    );

    sheet.classList.add(
        'active'
    );

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'no-scroll'
    );

    history.pushState(
        {sheet:'maulid'},
        ''
    );

}


function closeMaulid(){

    const sheet =
    document.getElementById(
        'maulidSheet'
    );

    const overlay =
    document.getElementById(
        'maulidOverlay'
    );

    sheet.classList.remove(
        'active'
    );

    overlay.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'no-scroll'
    );

}


/* =========================================
   RATIB SHEET
========================================= */

function openRatib(){

    const sheet =
    document.getElementById(
        'ratibSheet'
    );

    const overlay =
    document.getElementById(
        'ratibOverlay'
    );

    sheet.classList.add(
        'active'
    );

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'no-scroll'
    );

    history.pushState(
        {sheet:'ratib'},
        ''
    );

}


function closeRatib(){

    const sheet =
    document.getElementById(
        'ratibSheet'
    );

    const overlay =
    document.getElementById(
        'ratibOverlay'
    );

    sheet.classList.remove(
        'active'
    );

    overlay.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'no-scroll'
    );

}


/* =========================================
   SHOLAWAT SHEET
========================================= */

function openSholawat(){

    const sheet =
    document.getElementById(
        'sholawatSheet'
    );

    const overlay =
    document.getElementById(
        'sholawatOverlay'
    );

    sheet.classList.add(
        'active'
    );

    overlay.classList.add(
        'active'
    );

    document.body.classList.add(
        'no-scroll'
    );

    history.pushState(
        {sheet:'sholawat'},
        ''
    );

}


function closeSholawat(){

    const sheet =
    document.getElementById(
        'sholawatSheet'
    );

    const overlay =
    document.getElementById(
        'sholawatOverlay'
    );

    sheet.classList.remove(
        'active'
    );

    overlay.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'no-scroll'
    );

}


/* =========================================
   ACCORDION
========================================= */

document.addEventListener(
'DOMContentLoaded',
()=>{

    const accordions =
    document.querySelectorAll(
        '.accordion'
    );

    accordions.forEach(item=>{

        const header =
        item.querySelector(
            '.accordion-header'
        );

        if(!header) return;

        header.addEventListener(
        'click',
        ()=>{

            if(
                item.classList.contains(
                    'single'
                )
            ){

                return;

            }

            accordions.forEach(other=>{

                if(other !== item){

                    other.classList.remove(
                        'active'
                    );

                }

            });

            item.classList.toggle(
                'active'
            );

        });

    });

});


/* =========================================
   OPEN READER
========================================= */

function openReader(
folder,
file,
sheet
){

    sessionStorage.setItem(
        'restoreSheet',
        sheet
    );

    window.location.href =
    `pages/reader.html?folder=${folder}&file=${file}`;

}


/* =========================================
   MOBILE HISTORY FIX
========================================= */

window.addEventListener(
'pageshow',
()=>{

    const restore =

    sessionStorage.getItem(
        'restoreSheet'
    );

    if(!restore){

        return;

    }

    sessionStorage.removeItem(
        'restoreSheet'
    );

    const sheet =
    document.getElementById(
        restore
    );

    if(!sheet){

        return;

    }

    const overlay =
    document.querySelector(
        '.sheet-overlay'
    );

    sheet.style.transition =
    'none';

    sheet.classList.add(
        'active'
    );

    overlay?.classList.add(
        'active'
    );

    document.body.classList.add(
        'no-scroll'
    );

    requestAnimationFrame(()=>{

        sheet.style.transition =
        '';

    });

});


window.addEventListener(
'popstate',
()=>{

    const openedSheet =

    document.querySelector(
        '.bottom-sheet.active'
    );

    if(!openedSheet){

        return;

    }

    sessionStorage.setItem(
        'restoreSheet',
        openedSheet.id
    );

    openedSheet.classList.remove(
        'active'
    );

    document
    .querySelector(
        '.sheet-overlay.active'
    )
    ?.classList.remove(
        'active'
    );

    document.body.classList.remove(
        'no-scroll'
    );

});
