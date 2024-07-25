import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { CookieSetTourCompleted, CookieIsTourCompleted } from './cookiehandler.js';

export function startTour() {
    const driverObj = driver({
        showProgress: true,
        steps: [
            {
                popover: {
                    title: 'Welcome to the 3D Viewer!',
                    description: 'This quick tour will guide you through the main features of tellmewhereithurts.com',
                    position: 'mid-center'
                }
            },
            {
                element: '#main_viewer',
                popover: {
                    title: 'Pan and Orbit',
                    description: 'Click and drag in the viewer to pan and orbit the model. Use the scroll wheel or pinch gesture to zoom.',
                    side: "bottom",
                    align: "end"
                }
            },
            {
                element: 'i.icon.icon-highlight',
                popover: {
                    title: 'Highlight Tool',
                    description: 'Click here to activate the highlight tool. You can then click on the model to highlight specific areas.',
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: 'i.icon.icon-eraser',
                popover: {
                    title: 'Eraser Tool',
                    description: 'This is the eraser tool. Use it to remove highlights from the model.',
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                element: 'i.icon.icon-up_y',
                popover: {
                    title: 'Reset View',
                    description: 'Use this button to reset the view if you get lost',
                    side: "bottom",
                    align: 'start'
                }
            },
            {
                    element: 'div.ov_svg_icon:has(i.icon.icon-share)',                popover: {
                    title: 'Share Button',
                    description: 'Once you\'re ready, click here to download a snapshot of the model or share it with others.',
                    side: "left",
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
    };
}