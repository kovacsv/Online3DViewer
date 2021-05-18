
OV.ShowSharingDialog = function (importer, importSettings, camera)
{
    function AddCheckboxLine (parentDiv, text, id, onChange)
    {
        let line = $('<div>').addClass ('ov_dialog_table_row').appendTo (parentDiv);
        let check = $('<input>').attr ('type', 'checkbox').attr ('checked', 'true').addClass ('ov_dialog_checkradio').attr ('id', id).appendTo (line);
        $('<label>').attr ('for', id).html (text).appendTo (line);
        check.change (function () {
            onChange (check.prop ('checked'));
        });
    }

    function GetSharingLink (params)
    {
        let builder = OV.CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        builder.AddColor (params.color);
        let hashParameters = builder.GetParameterList ();
        return 'https://3dviewer.net#' + hashParameters;
    }

    function GetEmbeddingCode (params)
    {
        let builder = OV.CreateUrlBuilder ();
        builder.AddModelUrls (params.files);
        builder.AddCamera (params.camera);
        builder.AddColor (params.color);
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
        let button = $('<div>').addClass ('button').html (copyText).appendTo (container);
        button.click (function () {
            OV.CopyToClipboard (getText ());
            button.fadeOut (200, function () {
                button.html (copiedText).fadeIn (200);
                setTimeout (function () {
                    button.fadeOut (200, function () {
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
        let optionsSection = null;
        if (OV.FeatureSet.SetDefaultColor) {
            optionsSection = $('<div>').addClass ('ov_dialog_section').appendTo (section);
        }
        let sharingLinkInput = AddCopyableTextInput (section, function () {
            return GetSharingLink (sharingLinkParams);
        });
        if (OV.FeatureSet.SetDefaultColor) {
            AddCheckboxLine (optionsSection, 'Use overridden default color', 'share_color', function (checked) {
                sharingLinkParams.color = checked ? importSettings.defaultColor : null;
                sharingLinkInput.val (GetSharingLink (sharingLinkParams));
            });
            sharingLinkParams.color = importSettings.defaultColor;
        }        
        sharingLinkInput.val (GetSharingLink (sharingLinkParams));
    }

    function AddEmbeddingCodeTab (parentDiv, embeddingCodeParams)
    {
        let section = $('<div>').addClass ('ov_dialog_section').css ('margin-top', '20px').appendTo (parentDiv);
        $('<div>').html ('Embedding Code').addClass ('ov_dialog_inner_title').appendTo (section);
        let optionsSection = $('<div>').addClass ('ov_dialog_section').appendTo (section);
        let embeddingCodeInput = AddCopyableTextInput (section, function () {
            return GetEmbeddingCode (embeddingCodeParams);
        });
        AddCheckboxLine (optionsSection, 'Use current camera position', 'embed_camera', function (checked) {
            embeddingCodeParams.camera = checked ? camera : null;
            embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
        });
        if (OV.FeatureSet.SetDefaultColor) {
            AddCheckboxLine (optionsSection, 'Use overridden default color', 'embed_color', function (checked) {
                embeddingCodeParams.color = checked ? importSettings.defaultColor : null;
                embeddingCodeInput.val (GetEmbeddingCode (embeddingCodeParams));
            });
            embeddingCodeParams.color = importSettings.defaultColor;
        }
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
        files : modelFiles,
        color : null
    };

    let embeddingCodeParams = {
        files : modelFiles,
        camera : camera,
        color : null
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
    AddEmbeddingCodeTab (contentDiv, embeddingCodeParams);

    dialog.Show ();
    return dialog;
};
