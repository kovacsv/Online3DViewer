import { FileSource } from '../engine/io/fileutils.js';
import { AddDiv, AddDomElement, AddCheckbox } from '../engine/viewer/domutils.js';
import { CreateUrlBuilder } from '../engine/parameters/parameterlist.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './modal.js';
import { CopyToClipboard } from './utils.js';

export function ShowSharingDialog (fileList, settings, camera, eventHandler)
{
    function AddCheckboxLine (parentDiv, text, id, onChange)
    {
        let line = AddDiv (parentDiv, 'ov_dialog_row');
        let checkbox = AddCheckbox (line, id, text, true, () => {
            onChange (checkbox.checked);
        });
    }

    function GetSharingLink (params)
    {
        let builder = CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        let hashParameters = builder.GetParameterList ();
        return 'https://3dviewer.net#' + hashParameters;
    }

    function GetEmbeddingCode (params)
    {
        let builder = CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        builder.AddCamera (params.camera);
        builder.AddBackgroundColor (params.backgroundColor);
        builder.AddDefaultColor (params.defaultColor);
        builder.AddEdgeSettings (params.edgeSettings);
        let hashParameters = builder.GetParameterList ();

        let embeddingCode = '';
        embeddingCode += '<iframe';
        embeddingCode += ' width="640" height="480"';
        embeddingCode += ' style="border:1px solid #eeeeee;"';
        embeddingCode += ' src="https://3dviewer.net/embed.html#' + hashParameters + '">';
        embeddingCode += '</iframe>';
        return embeddingCode;
    }

    function AddCopyableTextInput (parentDiv, getText)
    {
        let copyText = 'Copy';
        let copiedText = 'Copied';
        let container = AddDiv (parentDiv, 'ov_dialog_copyable_input');
        let input = AddDomElement (container, 'input', 'ov_dialog_text');
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

    function AddSharingLinkTab (parentDiv, sharingLinkParams, eventHandler)
    {
        let section = AddDiv (parentDiv, 'ov_dialog_section');
        AddDiv (section, 'ov_dialog_inner_title', 'Sharing Link');
        let sharingLinkInput = AddCopyableTextInput (section, () => {
            eventHandler.HandleEvent ('model_shared', 'sharing_link');
            return GetSharingLink (sharingLinkParams);
        });
        sharingLinkInput.value = GetSharingLink (sharingLinkParams);
    }

    function AddEmbeddingCodeTab (parentDiv, settings, embeddingCodeParams, eventHandler)
    {
        let section = AddDiv (parentDiv, 'ov_dialog_section');
        section.style.marginTop = '20px';
        AddDiv (section, 'ov_dialog_inner_title', 'Embedding Code');
        let optionsSection = AddDiv (section, 'ov_dialog_section');
        let embeddingCodeInput = AddCopyableTextInput (section, () => {
            eventHandler.HandleEvent ('model_shared', 'embedding_code');
            return GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use current camera position', 'embed_camera', (checked) => {
            embeddingCodeParams.camera = checked ? camera : null;
            embeddingCodeInput.value = GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use overridden background color', 'embed_background', (checked) => {
            embeddingCodeParams.backgroundColor = checked ? settings.backgroundColor : null;
            embeddingCodeInput.value = GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use overridden default color', 'embed_color', (checked) => {
            embeddingCodeParams.defaultColor = checked ? settings.defaultColor : null;
            embeddingCodeInput.value = GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use overridden edge display', 'embed_edge_display', (checked) => {
            const edgeSettings = {
                showEdges : settings.edgeSettings,
                edgeColor : settings.edgeColor,
                edgeThreshold : settings.edgeThreshold
            };
            embeddingCodeParams.edgeSettings = checked ? edgeSettings : null;
            embeddingCodeInput.value = GetEmbeddingCode (embeddingCodeParams);
        });
        embeddingCodeInput.value = GetEmbeddingCode (embeddingCodeParams);
    }

    if (!fileList.IsOnlyUrlSource ()) {
        return ShowMessageDialog (
            'Sharing Failed',
            'Sharing works only if you load files by url. Please upload your model files to a web server, open them by url, and try embedding again.',
            null
        );
    }

    let files = fileList.GetFiles ();
    let modelFiles = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        let file = files[fileIndex];
        if (file.source === FileSource.Url) {
            modelFiles.push (file.fileUrl);
        }
    }

    let sharingLinkParams = {
        files : modelFiles
    };

    let embeddingCodeParams = {
        files : modelFiles,
        camera : camera,
        backgroundColor : settings.backgroundColor,
        defaultColor : settings.defaultColor,
        edgeSettings : {
            showEdges : settings.showEdges,
            edgeColor : settings.edgeColor,
            edgeThreshold : settings.edgeThreshold
        }
    };

    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init ('Share', [
        {
            name : 'Close',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);

    AddSharingLinkTab (contentDiv, sharingLinkParams, eventHandler);
    AddEmbeddingCodeTab (contentDiv, settings, embeddingCodeParams, eventHandler);

    dialog.Show ();
    return dialog;
}
