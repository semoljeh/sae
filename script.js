
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

    const accordions =
    sheet.querySelectorAll(
        '.accordion'
    );

    accordions.forEach(item=>{

        item.classList.remove(
            'active'
        );

    });

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

    const accordions =
    sheet.querySelectorAll(
        '.accordion'
    );

    accordions.forEach(item=>{

        item.classList.remove(
            'active'
        );

    });

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
        'lastSheet',
        sheet
    );

    window.location.href =
    `pages/reader.html?folder=${folder}&file=${file}`;

}


/* =========================================
   RESTORE SHEET
========================================= */

window.addEventListener(
'pageshow',
(event)=>{

    /* HANYA SAAT BACK */

    const nav =
    performance
    .getEntriesByType(
        'navigation'
    )[0];

    const isBack =

    event.persisted ||
    nav?.type ===
    'back_forward';


if(!isBack){

    /* HAPUS CACHE SHEET */

    sessionStorage.removeItem(
        'lastSheet'
    );

    return;

}


    /* AMBIL SHEET */

    const lastSheet =

    sessionStorage.getItem(
        'lastSheet'
    );

    if(!lastSheet){

        return;

    }


    /* RESET */

    document
    .querySelectorAll(
        '.bottom-sheet'
    )
    .forEach(sheet=>{

        sheet.classList.remove(
            'active'
        );

    });

    document
    .querySelectorAll(
        '.sheet-overlay'
    )
    .forEach(overlay=>{

        overlay.classList.remove(
            'active'
        );

    });


    /* RESTORE */

    const sheet =
    document.getElementById(
        lastSheet
    );

    if(sheet){

        /* MATIKAN ANIMASI */

        sheet.style.transition =
        'none';

        /* POSISI FINAL */

        sheet.style.bottom =
        '0';

        requestAnimationFrame(()=>{

            sheet.classList.add(
                'active'
            );

            requestAnimationFrame(()=>{

                /* AKTIFKAN LAGI */

                sheet.style.transition =
                '';

                sheet.style.bottom =
                '';

            });

        });

    }


    /* OVERLAY */

    if(lastSheet === 'dzikirSheet'){

        document
        .getElementById(
            'sheetOverlay'
        )
        ?.classList.add(
            'active'
        );

    }

    if(lastSheet === 'maulidSheet'){

        document
        .getElementById(
            'maulidOverlay'
        )
        ?.classList.add(
            'active'
        );

    }

    if(lastSheet === 'ratibSheet'){

        document
        .getElementById(
            'ratibOverlay'
        )
        ?.classList.add(
            'active'
        );

    }

    if(lastSheet === 'sholawatSheet'){

        document
        .getElementById(
            'sholawatOverlay'
        )
        ?.classList.add(
            'active'
        );

    }


    document.body.classList.add(
        'no-scroll'
    );

});


/* =========================================
   BACK BUTTON HP
========================================= */

window.addEventListener(
'popstate',
()=>{

    /* DZIKIR */

    if(
        document
        .getElementById(
            'dzikirSheet'
        )
        ?.classList.contains(
            'active'
        )
    ){

        closeDzikir();

        sessionStorage.removeItem(
            'lastSheet'
        );

        return;

    }


    /* MAULID */

    if(
        document
        .getElementById(
            'maulidSheet'
        )
        ?.classList.contains(
            'active'
        )
    ){

        closeMaulid();

        sessionStorage.removeItem(
            'lastSheet'
        );

        return;

    }


    /* RATIB */

    if(
        document
        .getElementById(
            'ratibSheet'
        )
        ?.classList.contains(
            'active'
        )
    ){

        closeRatib();

        sessionStorage.removeItem(
            'lastSheet'
        );

        return;

    }


    /* SHOLAWAT */

    if(
        document
        .getElementById(
            'sholawatSheet'
        )
        ?.classList.contains(
            'active'
        )
    ){

        closeSholawat();

        sessionStorage.removeItem(
            'lastSheet'
        );

        return;

    }

});
