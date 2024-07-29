import { SetExternalLibLocation } from '../engine/io/externallibs.js';
import { Loc } from '../engine/core/localization.js';
import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { Embed } from './embed.js';
import { Website } from './website.js';
import { SetEventHandler, HandleEvent } from './eventhandler.js';
import { PluginType, RegisterPlugin } from './pluginregistry.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { ShowMessageDialog } from './dialogs.js';
import { ImportSettings } from '../engine/import/importer.js';

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
import './css/sharingdialog.css';

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

export function StartWebsite (externalLibLocation)
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

        SetExternalLibLocation (externalLibLocation);
        let website = new Website ({
            headerDiv : document.getElementById ('header'),
            headerButtonsDiv : document.getElementById ('header_buttons'),
            toolbarDiv : document.getElementById ('toolbar'),
            mainDiv : document.getElementById ('main'),
            introDiv : document.getElementById ('intro'),
            introContentDiv : document.getElementById ('intro_content'),
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

        if (!website.hashHandler.HasHash()) {
            // Load the default FBX model
            let defaultModelUrl = 'assets/models/male_model.stl';
            let importSettings = new ImportSettings();
            importSettings.defaultLineColor = website.settings.defaultLineColor;
            importSettings.defaultColor = website.settings.defaultColor;
            HandleEvent('model_load_started', 'default');
            website.LoadModelFromUrlList([defaultModelUrl], importSettings);
        }
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
