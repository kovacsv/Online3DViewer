import { SetExternalLibLocation } from '../engine/io/externallibs.js';
import { CreateDomElement } from '../engine/viewer/domutils.js';
import { AddSvgIconElement, InstallTooltip } from './utils.js';
import { Embed } from './embed.js';
import { Website } from './website.js';

export function StartWebsite (externalLibLocation)
{
    SetExternalLibLocation (externalLibLocation);
    window.addEventListener ('load', () => {
        let website = new Website ({
            headerDiv : document.getElementById ('header'),
            toolbarDiv : document.getElementById ('toolbar'),
            mainDiv : document.getElementById ('main'),
            introDiv : document.getElementById ('intro'),
            fileNameDiv : document.getElementById ('main_file_name'),
            navigatorDiv : document.getElementById ('main_navigator'),
            navigatorSplitterDiv : document.getElementById ('main_navigator_splitter'),
            sidebarDiv : document.getElementById ('main_sidebar'),
            sidebarSplitterDiv : document.getElementById ('main_sidebar_splitter'),
            viewerDiv : document.getElementById ('main_viewer'),
            fileInput : document.getElementById ('open_file'),
            eventHandler : window.viewerEventHandler
        });
        website.Load ();
    });
}

export function StartEmbed (externalLibLocation)
{
    SetExternalLibLocation (externalLibLocation);
    window.addEventListener ('load', () => {
        let embed = new Embed ({
            viewerDiv : document.getElementById ('embed_viewer'),
            websiteLinkDiv : document.getElementById ('website_link')
        });
        embed.Load ();
    });
}

export function CreateHeaderButton (parentElement, iconName, title, link)
{
    let buttonLink = CreateDomElement ('a');
    buttonLink.setAttribute ('href', link);
    buttonLink.setAttribute ('target', '_blank');
    buttonLink.setAttribute ('rel', 'noopener noreferrer');
    InstallTooltip (buttonLink, title);
    AddSvgIconElement (buttonLink, iconName, 'header_button');
    parentElement.appendChild (buttonLink);
    return buttonLink;
}
