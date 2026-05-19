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
        {sheet:'dzikirSheet'},
        ''
    );

}


function closeDzikir(){

    document
    .getElementById(
        'dzikirSheet'
    )
    ?.classList.remove(
        'active'
    );

    document
    .getElementById(
        'sheetOverlay'
    )
    ?.classList.remove(
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
        {sheet:'maulidSheet'},
        ''
    );

}


function closeMaulid(){

    document
    .getElementById(
        'maulidSheet'
    )
    ?.classList.remove(
        'active'
    );

    document
    .getElementById(
        'maulidOverlay'
    )
    ?.classList.remove(
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
        {sheet:'ratibSheet'},
        ''
    );

}


function closeRatib(){

    document
    .getElementById(
        'ratibSheet'
    )
    ?.classList.remove(
        'active'
    );

    document
    .getElementById(
        'ratibOverlay'
    )
    ?.classList.remove(
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
        {sheet:'sholawatSheet'},
        ''
    );

}


function closeSholawat(){

    document
    .getElementById(
        'sholawatSheet'
    )
    ?.classList.remove(
        'active'
    );

    document
    .getElementById(
        'sholawatOverlay'
    )
    ?.classList.remove(
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
   BACK BUTTON HP
========================================= */


        document.body.classList.remove(
            'no-scroll'
        );

        return;

    }


    /* RESTORE SHEET */

    if(event.state?.sheet){

        const sheet =
        document.getElementById(
            event.state.sheet
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

    }

});


/* =========================================
   MOBILE BACK FIX
========================================= */

window.addEventListener(
'pageshow',
(event)=>{

    if(
        performance
        .navigation
        .type !== 2
    ){

        sessionStorage.removeItem(
            'lastSheet'
        );

        return;

    }

    const lastSheet =

    sessionStorage.getItem(
        'lastSheet'
    );

    if(!lastSheet){

        return;

    }

    const sheet =
    document.getElementById(
        lastSheet
    );

    if(!sheet){

        return;

    }

    document
    .querySelectorAll(
        '.bottom-sheet'
    )
    .forEach(item=>{

        item.classList.remove(
            'active'
        );

    });

    sheet.style.transition =
    'none';

    sheet.classList.add(
        'active'
    );

    requestAnimationFrame(()=>{

        sheet.style.transition =
        '';

    });

});
