OV.FeatureSet =
{
    SetDefaultColor : false
};

OV.ShowMessageDialog = function (title, message, subMessage)
{
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init (title, [
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);
    $('<div>').addClass ('ov_dialog_message').html (message).appendTo (contentDiv);
    if (subMessage !== null) {
        $('<div>').addClass ('ov_dialog_submessage').html ('<i>' + subMessage + '</i>').appendTo (contentDiv);
    }
    dialog.Show ();
    return dialog;
};

OV.ShowOpenUrlDialog = function (onOk)
{
    function CorrectFileHostUrls (urls)
    {
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            if (url.search (/www\.dropbox\.com/u) !== -1) {
                url = url.replace ('www.dropbox.com', 'dl.dropbox.com');
                let separatorPos = url.indexOf ('?');
                if (separatorPos !== -1) {
                    url = url.substr (0, separatorPos);
                }
                urls[i] = url;
            } else if (url.search (/github\.com/u) !== -1) {
                url = url.replace ('github.com', 'raw.githubusercontent.com');
                url = url.replace ('/blob', '');
                let separatorPos = url.indexOf ('?');
                if (separatorPos !== -1) {
                    url = url.substr (0, separatorPos);
                }
                urls[i] = url;
            }
        }
    }

    let dialog = new OV.ButtonDialog ();
    let urlsTextArea = $('<textarea>').addClass ('ov_dialog_textarea');
    let contentDiv = dialog.Init ('Open Model from Url', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Hide ();
            }
        },
        {
            name : 'OK',
            onClick () {
                let urls = [];
                OV.ReadLines (urlsTextArea.val (), function (line) {
                    urls.push (line);
                });
                dialog.Hide ();
                CorrectFileHostUrls (urls);
                onOk (urls);
            }
        }
    ]);
    let text = 'Here you can load models based on their urls. You can add more lines if your model builds up from multiple files.';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    urlsTextArea.appendTo (contentDiv);
    dialog.Show ();
    return dialog;
};

OV.ShowEmbeddingDialog = function (importer, importSettings, camera)
{
    function AddCheckboxLine (parentDiv, text, onChange)
    {
        let line = $('<div>').addClass ('ov_dialog_table_row').appendTo (parentDiv);
        let check = $('<input>').attr ('type', 'checkbox').attr ('checked', 'true').appendTo (line);
        $('<span>').html (text).appendTo (line);
        check.change (function () {
            onChange (check.prop ('checked'));
        });
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

    if (!importer.IsOnlyFileSource (OV.FileSource.Url)) {
        return OV.ShowMessageDialog (
            'Embedding Failed',
            'Embedding works only if you load files by url. Please upload your model files to a web server, open them by url, and try embedding again.',
            null
        );
    }
    
    let files = importer.GetFileList ().GetFiles ();
    let modelFiles = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        let file = files[fileIndex];
        modelFiles.push (file.fileUrl);
    }

    let embeddingParams = {
        files : modelFiles,
        camera : camera,
        color : null
    };

    let dialog = new OV.ButtonDialog ();
    let urlsTextArea = $('<textarea>').attr ('readonly', 'true').addClass ('ov_dialog_textarea');
    let contentDiv = dialog.Init ('Embedding', [
        {
            name : 'Close',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);

    let text = 'Embedding options:';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    let optionsSection = $('<div>').addClass ('ov_dialog_section').appendTo (contentDiv);

    AddCheckboxLine (optionsSection, 'Use current camera position', function (checked) {
        embeddingParams.camera = checked ? camera : null;
        urlsTextArea.val (GetEmbeddingCode (embeddingParams));
    });

    if (OV.FeatureSet.SetDefaultColor) {
        AddCheckboxLine (optionsSection, 'Use overridden default color', function (checked) {
            embeddingParams.color = checked ? importSettings.defaultColor : null;
            urlsTextArea.val (GetEmbeddingCode (embeddingParams));
        });
        embeddingParams.color = importSettings.defaultColor;
    }

    urlsTextArea.val (GetEmbeddingCode (embeddingParams));

    urlsTextArea.appendTo (contentDiv);
    let copyToClipboardText = 'copy to clipboard';
    let copiedToClipboardText = 'successfully copied';
    let innerButtonContainer = $('<div>').addClass ('ov_dialog_inner_buttons').appendTo (contentDiv);
    let copyButton = $('<div>').addClass ('ov_dialog_inner_button').html (copyToClipboardText).appendTo (innerButtonContainer);
    copyButton.click (function () {
        OV.CopyToClipboard (urlsTextArea.val ());
        copyButton.fadeOut (200, function () {
            copyButton.html (copiedToClipboardText).fadeIn (200);
            setTimeout (function () {
                copyButton.fadeOut (200, function () {
                    copyButton.html (copyToClipboardText).fadeIn (200);
                });
            }, 2000);
        });
    });

    dialog.Show ();
    return dialog;
};

OV.ShowSettingsDialog = function (importSettings, onOk)
{
    let dialogSettings = {
        defaultColor : importSettings.defaultColor
    };
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Settings', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Hide ();
            }
        },
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();                
                onOk (dialogSettings);
            }
        }
    ]);
    
    let colorRow = $('<div>').addClass ('ov_dialog_table_row').appendTo (contentDiv);
    $('<div>').html ('Default Color').addClass ('ov_dialog_table_row_name').appendTo (colorRow);
    let valueColumn = $('<div>').addClass ('ov_dialog_table_row_value').appendTo (colorRow);
    let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_dialog_color').appendTo (valueColumn);
    colorInput.val ('#' + OV.ColorToHexString (dialogSettings.defaultColor));
    colorInput.change (function () {
        let colorStr = colorInput.val ().substr (1);
        dialogSettings.defaultColor = OV.HexStringToColor (colorStr);
    });
    dialog.Show ();
    return dialog;
};

OV.ShowListPopup = function (button, items, callbacks)
{
    let popup = new OV.ListPopup ();
    popup.SetCustomResizeHandler (function (modalDiv) {
        let offset = button.offset ();
        let left = offset.left + button.outerWidth (true);
        let bottom = offset.top + button.outerHeight (true);
        modalDiv.offset ({
            left : left,
            top : bottom - modalDiv.outerHeight (true)
        });
    });
    popup.Init ();
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        popup.AddListItem (item, {
            onHoverStart : function () {
                if (callbacks.onHoverStart) {
                    callbacks.onHoverStart (i);
                }
            },
            onHoverStop : function () {
                if (callbacks.onHoverStop) {
                    callbacks.onHoverStop (i);
                }
            },
            onClick : function () {
                popup.Hide ();
                callbacks.onClick (i);
            }
        });
    }
    popup.Show ();
    return popup;
};
