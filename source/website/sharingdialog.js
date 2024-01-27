import { FileSource } from '../engine/io/fileutils.js';
import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { CreateUrlBuilder } from '../engine/parameters/parameterlist.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { CopyToClipboard } from './utils.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';

export function ShowSharingDialog (fileList, settings, viewer)
{
    function AddCheckboxLine (parentDiv, text, id, onChange)
    {
        let line = AddDiv (parentDiv, 'ov_dialog_row');
        let checkbox = AddCheckbox (line, id, text, true, () => {
            onChange (checkbox.checked);
        });
    }

    function AddCopyableTextInput (parentDiv, getText)
    {
        let copyText = Loc ('Copy');
        let copiedText = Loc ('Copied');
        let container = AddDiv (parentDiv, 'ov_dialog_copyable_input');
        let input = AddDomElement (container, 'input', null);
        input.setAttribute ('type', 'text');
        input.readOnly = true;
        let button = AddDiv (container, 'ov_button outline ov_dialog_copyable_input_button', copyText);
        button.addEventListener ('click', () => {
            CopyToClipboard (getText ());
            button.innerHTML = copiedText;
            setTimeout (() => {
                button.innerHTML = copyText;
            }, 2000);
        });
        return input;
    }

    function AddSharingLinkTab (parentDiv, modelFiles)
    {
        function GetSharingLink (modelFiles)
        {
            let builder = CreateUrlBuilder ();
            builder.AddModelUrls (modelFiles);
            let hashParameters = builder.GetParameterList ();
            return 'https://3dviewer.net/#' + hashParameters;
        }

        let section = AddDiv (parentDiv, 'ov_dialog_section');
        AddDiv (section, 'ov_dialog_inner_title', Loc ('Sharing Link'));
        let sharingLinkInput = AddCopyableTextInput (section, () => {
            HandleEvent ('model_shared', 'sharing_link');
            return GetSharingLink (modelFiles);
        });
        sharingLinkInput.value = GetSharingLink (modelFiles);
    }

    function AddEmbeddingCodeTab (parentDiv, modelFiles, settings, viewer)
    {
        function GetEmbeddingCode (modelFiles, useCurrentSettings, settings, viewer)
        {
            let builder = CreateUrlBuilder ();
            builder.AddModelUrls (modelFiles);
            if (useCurrentSettings) {
                builder.AddCamera (viewer.GetCamera ());
                builder.AddProjectionMode (viewer.GetProjectionMode ());
                let environmentSettings = {
                    environmentMapName : settings.environmentMapName,
                    backgroundIsEnvMap : settings.backgroundIsEnvMap
                };
                builder.AddEnvironmentSettings (environmentSettings);
                builder.AddBackgroundColor (settings.backgroundColor);
                builder.AddDefaultColor (settings.defaultColor);
                builder.AddDefaultLineColor (settings.defaultLineColor);
                builder.AddEdgeSettings (settings.edgeSettings);
            }
            let hashParameters = builder.GetParameterList ();

            let embeddingCode = '';
            embeddingCode += '<iframe';
            embeddingCode += ' width="640" height="480"';
            embeddingCode += ' style="border:1px solid #eeeeee;"';
            embeddingCode += ' src="https://3dviewer.net/embed.html#' + hashParameters + '">';
            embeddingCode += '</iframe>';
            return embeddingCode;
        }

        let useCurrentSettings = true;
        let section = AddDiv (parentDiv, 'ov_dialog_section');
        section.style.marginTop = '20px';
        AddDiv (section, 'ov_dialog_inner_title', Loc ('Embedding Code'));
        let optionsSection = AddDiv (section, 'ov_dialog_section');
        let embeddingCodeInput = AddCopyableTextInput (section, () => {
            HandleEvent ('model_shared', 'embedding_code');
            return GetEmbeddingCode (modelFiles, useCurrentSettings, settings, viewer);
        });
        AddCheckboxLine (optionsSection, Loc ('Use customized settings'), 'embed_current_settings', (checked) => {
            useCurrentSettings = checked;
            embeddingCodeInput.value = GetEmbeddingCode (modelFiles, useCurrentSettings, settings, viewer);
        });

        embeddingCodeInput.value = GetEmbeddingCode (modelFiles, useCurrentSettings, settings, viewer);
    }

    if (!fileList.IsOnlyUrlSource ()) {
        return ShowMessageDialog (
            Loc ('Sharing Failed'),
            Loc ('Sharing works only if you load files by url. Please upload your model files to a web server, open them by url, and try embedding again.'),
            null
        );
    }

    let files = fileList.GetFiles ();
    let modelFiles = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        let file = files[fileIndex];
        if (file.source === FileSource.Url) {
            modelFiles.push (file.data);
        }
    }

    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init (Loc ('Share'), [
        {
            name : Loc ('Close'),
            onClick () {
                dialog.Close ();
            }
        }
    ]);

    AddSharingLinkTab (contentDiv, modelFiles);
    AddEmbeddingCodeTab (contentDiv, modelFiles, settings, viewer);

    dialog.Open ();
    return dialog;
}
