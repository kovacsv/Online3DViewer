function Resize ()
{
    let isMobile = window.matchMedia ('(max-width: 600px)').matches;
    let navToggleDiv = document.getElementById ('navigation_toggle');
    let navDiv = document.getElementById ('navigation');
    let mainDiv = document.getElementById ('main');

    if (isMobile) {
        navDiv.style.width = '100%';
        mainDiv.style.marginLeft = '0px';

        navToggleDiv.style.display = 'block';
        navDiv.style.display = 'none';
    } else {
        let navWidth = '300px';

        navDiv.style.width = navWidth;
        mainDiv.style.marginLeft = navWidth;

        navToggleDiv.style.display = 'none';
        navDiv.style.display = 'block';
    }
}

function Init (menuName)
{
    Resize ();
    let menuItem = document.getElementById ('nav-' + menuName);
    if (menuItem !== null) {
        menuItem.classList.add ('selected');
        let scrollSetFromStorage = false;
        if (window.sessionStorage) {
            let scrollPos = window.sessionStorage.getItem ('navScrollPos');
            if (scrollPos) {
                let navDiv = document.getElementById ('navigation');
                navDiv.scrollTop = parseInt (scrollPos, 10);
                scrollSetFromStorage = true;
            }
        }
        if (!scrollSetFromStorage) {
            menuItem.scrollIntoView ({ block : 'center' });
        }
    }
    hljs.highlightAll ();
}

window.addEventListener ('load', () => {
    Resize ();
    window.addEventListener ('resize', () => {
        Resize ();
    })

    let navToggleDiv = document.getElementById ('navigation_toggle');
    let navIconDiv = document.getElementById ('navigation_icon');
    let navDiv = document.getElementById ('navigation');
    navToggleDiv.addEventListener ('click', () => {
        if (navDiv.style.display === 'none') {
            navDiv.style.display = 'block';
            navIconDiv.src = 'static/close.svg';
        } else {
            navDiv.style.display = 'none';
            navIconDiv.src = 'static/menu.svg';
        }
    });
});

window.addEventListener ('beforeunload', (ev) => {
    if (window.sessionStorage) {
        let navDiv = document.getElementById ('navigation');
        window.sessionStorage.setItem ('navScrollPos', navDiv.scrollTop.toString ());
    }
});
