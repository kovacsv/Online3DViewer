import { SetExternalLibLocation } from '../engine/io/externallibs.js';
import { Embed } from './embed.js';
import { Website } from './website.js';
import { SetEventHandler } from './eventhandler.js';
import { PluginType, RegisterPlugin } from './pluginregistry.js';

import * as Engine from '../engine/main.js';
export { Engine };

import { ButtonDialog } from './dialog.js';
export const UI = {
    ButtonDialog
};

export function SetWebsiteEventHandler (eventHandler)
{
    SetEventHandler (eventHandler);
}

export function RegisterHeaderPlugin (plugin)
{
    RegisterPlugin (PluginType.Header, plugin);
}

export function RegisterToolbarPlugin (plugin)
{
    RegisterPlugin (PluginType.Toolbar, plugin);
}

export function StartWebsite (externalLibLocation)
{
    SetExternalLibLocation (externalLibLocation);
    window.addEventListener ('load', () => {
        let website = new Website ({
            headerDiv : document.getElementById ('header'),
            headerButtonsDiv : document.getElementById ('header_buttons'),
            toolbarDiv : document.getElementById ('toolbar'),
            mainDiv : document.getElementById ('main'),
            introDiv : document.getElementById ('intro'),
            fileNameDiv : document.getElementById ('main_file_name'),
            navigatorDiv : document.getElementById ('main_navigator'),
            navigatorSplitterDiv : document.getElementById ('main_navigator_splitter'),
            sidebarDiv : document.getElementById ('main_sidebar'),
            sidebarSplitterDiv : document.getElementById ('main_sidebar_splitter'),
            viewerDiv : document.getElementById ('main_viewer'),
            fileInput : document.getElementById ('open_file')
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
