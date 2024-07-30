import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { CookieSetTourCompleted, CookieIsTourCompleted } from './cookiehandler.js';

export function startTour() {
    const driverObj = driver({
        showProgress: true,
        steps: [
            {
                popover: {
                    title: 'Welcome to the TellMeWhereItHurtsNow.com!',
                    description: 'This quick tour will guide you through the main features of our pain pointing tool',
                    position: 'mid-center'
                }
            },
            {
                element: '#main_viewer',
                popover: {
                    title: 'Pan and Orbit',
                    description: `
                        <div class='gif-popover' style='display: flex; justify-content: space-around;'>
                            <img style='max-width: 50%;' src='assets/images/orbit.gif' />
                            <img style='max-width: 50%;' src='assets/images/pan_zoom.gif' />
                        </div>
                        <p>Click and drag in the viewer to pan and orbit the model. Use the scroll wheel or pinch gesture to zoom.</p>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            {
                element: 'i.icon.icon-highlight',
                popover: {
                    title: 'Highlight Tool',
                    description: `
                    <div class='gif-popover' style='display: flex; justify-content: space-around;'>
                        <img style='max-width: 75%;' src='assets/images/highlight.gif' />
                    </div>
                    <p>Click here to activate the highlight tool. You can then click on the model to highlight specific areas.</p>,
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: 'i.icon.icon-eraser',
                popover: {
                    title: 'Eraser Tool',
                    description: `
                    <div class='gif-popover' style='display: flex; justify-content: space-around;'>
                        <img style='max-width: 75%;' src='assets/images/eraser.gif' />
                    </div>
                    <p> This is the eraser tool. Use it to remove highlights from the model.</p>,
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: 'i.icon.icon-up_y',
                popover: {
                    title: 'Reset View',
                    description: 'Use this button to reset the view if you get lost',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: 'div.ov_svg_icon:has(i.icon.icon-share)',                
                popover: {
                    title: 'Share Button',
                    description: 'Once you\'re ready, click here to download a snapshot of the model or share it with others.',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                popover: {
                    title: 'Tour Complete!',
                    description: 'You\'re now ready to explore the model and use all the tools. Enjoy!',
                }
            }
        ]
    });

    if (!CookieIsTourCompleted()) {
        driverObj.drive();
        CookieSetTourCompleted(true);
    }
}