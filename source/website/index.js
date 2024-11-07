import { Loc } from '../engine/core/localization.js';
import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { Embed } from './embed.js';
import { Website } from './website.js';
import { SetEventHandler, HandleEvent } from './eventhandler.js';
import { PluginType, RegisterPlugin } from './pluginregistry.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { ShowMessageDialog } from './dialogs.js';

import * as Engine from '../engine/main.js';
export { Engine };

import './css/icons.css';
import './css/themes.css';
import './css/core.css';
import './css/controls.css';
import './css/dialogs.css';
import './css/treeview.css';
import './css/panelset.css';
import './css/navigator.css';
import './css/sidebar.css';
import './css/website.css';
import './css/embed.css';

export const UI = {
    ButtonDialog,
    ProgressDialog,
    ShowMessageDialog,
    HandleEvent,
    Loc
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

export function StartWebsite ()
{
    window.addEventListener ('load', () => {
        if (window.self !== window.top) {
            let noEmbeddingDiv = AddDiv (document.body, 'noembed');
            AddDiv (noEmbeddingDiv, null, Loc ('Embedding Online 3D Viewer in an iframe is not supported.'));
            let link = AddDomElement (noEmbeddingDiv, 'a', null, Loc ('Open Online 3D Viewer'));
            link.target = '_blank';
            link.href = window.self.location;
            return;
        }

        document.getElementById ('intro_dragdrop_text').innerHTML = Loc ('Drag and drop 3D models here.');
        document.getElementById ('intro_formats_title').innerHTML = Loc ('Check an example file:');

        let website = new Website ({
            headerDiv : document.getElementById ('header'),
            headerButtonsDiv : document.getElementById ('header_buttons'),
            toolbarDiv : document.getElementById ('toolbar'),
            mainDiv : document.getElementById ('main'),
            introDiv : document.getElementById ('intro'),
            introContentDiv : document.getElementById ('intro_content'),
            fileNameDiv : document.getElementById ('main_file_name'),
            leftContainerDiv : document.getElementById ('main_left_container'),
            navigatorDiv : document.getElementById ('main_navigator'),
            navigatorSplitterDiv : document.getElementById ('main_navigator_splitter'),
            rightContainerDiv : document.getElementById ('main_right_container'),
            sidebarDiv : document.getElementById ('main_sidebar'),
            sidebarSplitterDiv : document.getElementById ('main_sidebar_splitter'),
            viewerDiv : document.getElementById ('main_viewer'),
            fileInput : document.getElementById ('open_file')
        });
        website.Load ();
    });
}

export function StartWebsiteCustom (params)
{
    window.addEventListener ('load', () => {
        if (window.self !== window.top) {
            let noEmbeddingDiv = AddDiv (document.body, 'noembed');
            AddDiv (noEmbeddingDiv, null, Loc ('Embedding Online 3D Viewer in an iframe is not supported.'));
            let link = AddDomElement (noEmbeddingDiv, 'a', null, Loc ('Open Online 3D Viewer'));
            link.target = '_blank';
            link.href = window.self.location;
            return;
        }

        if (params.dragDropEnabled) {
            document.getElementById ('intro_dragdrop_text').innerHTML = Loc ('Drag and drop 3D models here.');
            document.getElementById ('intro_formats_title').innerHTML = Loc ('Check an example file:');
        }

        let website = new Website ({
            headerDiv : document.getElementById (params.headerDiv ?? 'header'),
            headerButtonsDiv : document.getElementById (params.headerButtonsDiv ?? 'header_buttons'),
            toolbarDiv : document.getElementById (params.toolbarDiv ?? 'toolbar'),
            mainDiv : document.getElementById (params.mainDiv ?? 'main'),
            introDiv : document.getElementById (params.introDiv ?? 'intro'),
            introContentDiv : document.getElementById (params.introContentDiv ?? 'intro_content'),
            fileNameDiv : document.getElementById (params.fileNameDiv ?? 'main_file_name'),
            leftContainerDiv : document.getElementById (params.leftContainerDiv ?? 'main_left_container'),
            navigatorDiv : document.getElementById (params.navigatorDiv ?? 'main_navigator'),
            navigatorSplitterDiv : document.getElementById (params.navigatorSplitterDiv ?? 'main_navigator_splitter'),
            rightContainerDiv : document.getElementById (params.rightContainerDiv ?? 'main_right_container'),
            sidebarDiv : document.getElementById (params.sidebarDiv ?? 'main_sidebar'),
            sidebarSplitterDiv : document.getElementById (params.sidebarSplitterDiv ?? 'main_sidebar_splitter'),
            viewerDiv : document.getElementById (params.viewerDiv ?? 'main_viewer'),
            fileInput : document.getElementById (params.fileInput ?? 'open_file'),
            dragDropEnabled: params.dragDropEnabled
        });
        website.Load ({
            openFileBrowserDialogDisabled: params.openFileBrowserDialogDisabled,
            showOpenUrlDialogDisabled: params.showOpenUrlDialogDisabled
        });
        params.websiteLoaded(website);
    });
}

export function StartEmbed ()
{
    window.addEventListener ('load', () => {
        let embed = new Embed ({
            viewerDiv : document.getElementById ('embed_viewer'),
            websiteLinkDiv : document.getElementById ('website_link')
        });
        embed.Load ();
    });
}
