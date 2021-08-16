OV.ShowSharingDialog = function (importer, settings, camera)
{
    function AddCheckboxLine (parentDiv, text, id, onChange)
    {
        let line = $('<div>').addClass ('ov_dialog_row').appendTo (parentDiv);
        let check = $('<input>').attr ('type', 'checkbox').attr ('checked', 'true').addClass ('ov_dialog_checkradio').attr ('id', id).appendTo (line);
        $('<label>').attr ('for', id).html (text).appendTo (line);
        check.change (() => {
            onChange (check.prop ('checked'));
        });
    }

    function GetSharingLink (params)
    {
        let builder = OV.CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        let hashParameters = builder.GetParameterList ();
        return 'https://3dviewer.net#' + hashParameters;
    }

    function GetEmbeddingCode (params)
    {
        let builder = OV.CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        builder.AddCamera (params.camera);
        builder.AddBackground (params.backgroundColor);
        builder.AddColor (params.defaultColor);
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
        let copyText = 'copy';
        let copiedText = 'copied';
        let container = $('<div>').addClass ('ov_dialog_copyable_input').appendTo (parentDiv);
        let input = $('<input>').prop ('readonly', true).appendTo (container);
        let button = $('<div>').addClass ('ov_button').addClass ('outline').addClass ('ov_dialog_copyable_input_button').html (copyText).appendTo (container);
        button.click (() => {
            OV.CopyToClipboard (getText ());
            button.fadeOut (200, () => {
                button.html (copiedText).fadeIn (200);
                setTimeout (() => {
                    button.fadeOut (200, () => {
                        button.html (copyText).fadeIn (200);
                    });
                }, 2000);
            });
        });
        return input;
    }

    function AddSharingLinkTab (parentDiv, sharingLinkParams)
    {
        let section = $('<div>').addClass ('ov_dialog_section').appendTo (parentDiv);
        $('<div>').html ('Sharing Link').addClass ('ov_dialog_inner_title').appendTo (section);
        let sharingLinkInput = AddCopyableTextInput (section, () => {
            return GetSharingLink (sharingLinkParams);
        }); 
        sharingLinkInput.val (GetSharingLink (sharingLinkParams));
    }

    function AddEmbeddingCodeTab (parentDiv, settings, embeddingCodeParams)
    {
        let section = $('<div>').addClass ('ov_dialog_section').css ('margin-top', '20px').appendTo (parentDiv);
        $('<div>').html ('Embedding Code').addClass ('ov_dialog_inner_title').appendTo (section);
        let optionsSection = $('<div>').addClass ('ov_dialog_section').appendTo (section);
        let embeddingCodeInput = AddCopyableTextInput (section, () => {
            return GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use current camera position', 'embed_camera', (checked) => {
            embeddingCodeParams.camera = checked ? camera : null;
            embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
        });
        AddCheckboxLine (optionsSection, 'Use overridden background color', 'embed_background', (checked) => {
            embeddingCodeParams.backgroundColor = checked ? settings.backgroundColor : null;
            embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
        });
        AddCheckboxLine (optionsSection, 'Use overridden default color', 'embed_color', (checked) => {
            embeddingCodeParams.defaultColor = checked ? settings.defaultColor : null;
            embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
        });
        embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
    }

    if (!importer.IsOnlyFileSource (OV.FileSource.Url)) {
        return OV.ShowMessageDialog (
            'Sharing Failed',
            'Sharing works only if you load files by url. Please upload your model files to a web server, open them by url, and try embedding again.',
            null
        );
    }
    
    let files = importer.GetFileList ().GetFiles ();
    let modelFiles = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        let file = files[fileIndex];
        modelFiles.push (file.fileUrl);
    }

    let sharingLinkParams = {
        files : modelFiles
    };

    let embeddingCodeParams = {
        files : modelFiles,
        camera : camera,
        backgroundColor : settings.backgroundColor,
        defaultColor : settings.defaultColor
    };

    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Share', [
        {
            name : 'Close',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);

    AddSharingLinkTab (contentDiv, sharingLinkParams);
    AddEmbeddingCodeTab (contentDiv, settings, embeddingCodeParams);

    dialog.Show ();
    return dialog;
};
