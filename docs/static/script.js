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
        navDiv.style.width = '300px';
        mainDiv.style.marginLeft = '300px';

        navToggleDiv.style.display = 'none';
        navDiv.style.display = 'block';
    }
}

function Init (menuName)
{
    Resize ();
    let menuItem = document.getElementById ('nav-' + menuName);
    if (menuItem === null) {
        return;
    }
    menuItem.scrollIntoView ({ block : 'center' });
    hljs.highlightAll ();
}

window.addEventListener ('load', () => {
    Resize ();
    window.addEventListener ('resize', () => {
        Resize ();
    })

    let navToggleDiv = document.getElementById ('navigation_toggle');
    let navDiv = document.getElementById ('navigation');
    navToggleDiv.addEventListener ('click', () => {
        if (navDiv.style.display === 'none') {
            navDiv.style.display = 'block';
        } else {
            navDiv.style.display = 'none';
        }
    });
});
