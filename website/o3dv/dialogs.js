OV.ProgressDialog = class
{
    constructor ()
    {
        this.modal = new OV.Modal ();
        this.modal.SetCloseable (false);
        this.imageDiv = null;
        this.textDiv = null;
    }

    SetText (text)
    {
        this.textDiv.html (text);
    }

    Show (text)
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.addClass ('ov_progress');

        this.imageDiv = $('<img>').addClass ('ov_progress_img').attr ('src', 'assets/images/3dviewer_net_logo.svg').appendTo (contentDiv);
        this.textDiv = $('<div>').addClass ('ov_progress_text').appendTo (contentDiv);
        
        this.SetText (text);
        this.modal.Open ();
    }

    Hide ()
    {
        this.modal.Close ();
    }
};

OV.ButtonDialog = class
{
    constructor ()
    {
        this.modal = new OV.Modal ();
    }

    Init (title, buttons)
    {
        function AddButton (button, buttonsDiv)
        {
            let buttonDiv = $('<div>').addClass ('ov_dialog_button').html (button.name).appendTo (buttonsDiv);
            if (button.subClass) {
                buttonDiv.addClass (button.subClass);
            }
            buttonDiv.click (function () {
                button.onClick ();
            });
        }

        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.addClass ('ov_dialog');

        $('<div>').addClass ('ov_dialog_title').html (title).appendTo (contentDiv);
        let dialogContentDiv = $('<div>').addClass ('ov_dialog_content').appendTo (contentDiv);
        let buttonsDiv = $('<div>').addClass ('ov_dialog_buttons').appendTo (contentDiv);
        let buttonsInnerDiv = $('<div>').addClass ('ov_dialog_buttons_inner').appendTo (buttonsDiv);
        for (let i = 0; i < buttons.length; i++) {
            AddButton (buttons[i], buttonsInnerDiv);
        }
        
        return dialogContentDiv;
    }

    Show ()
    {
        this.modal.Open ();
    }

    Hide ()
    {
        this.modal.Close ();
    }
};

OV.ListPopup = class
{
    constructor ()
    {
        this.modal = new OV.Modal ();
        this.listDiv = null;
    }

    Init ()
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.addClass ('ov_popup');
        this.listDiv = $('<div>').addClass ('ov_popup_list').addClass ('ov_thin_scrollbar').appendTo (contentDiv);
    }

    SetCustomResizeHandler (customResizeHandler)
    {
        this.modal.SetCustomResizeHandler (customResizeHandler);
    }

    AddListItem (item, callbacks)
    {
        let listItemDiv = $('<div>').addClass ('ov_popup_list_item').appendTo (this.listDiv);
        if (item.color) {
            $('<div>').addClass ('ov_popup_list_item_rgbbox').css ('background', '#' + item.color).appendTo (listItemDiv);    
        }
        $('<div>').addClass ('ov_popup_list_item_name').html (item.name).appendTo (listItemDiv);
        listItemDiv.click (callbacks.onClick);
        if (OV.IsHoverEnabled () && callbacks.onHoverStart && callbacks.onHoverStop) {
            listItemDiv.hover (
                function () {
                    callbacks.onHoverStart ();
                },
                function () {
                    callbacks.onHoverStop ();
                }
            );
        }
    }

    Show ()
    {
        this.modal.Open ();
    }

    Hide ()
    {
        this.modal.Close ();
    }
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

OV.ShowExportDialog = function (model)
{
    if (model === null) {
        return OV.ShowMessageDialog ('Export Failed', 'Please load a model to export', null);
    }

    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Export', [
        {
            name : 'Close',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);
    
    let text = 'Select a format from the below list to export your model. Please note that the export can take several second.';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);

    let formats = [
        { name : 'obj (ascii)', format : OV.FileFormat.Text, extension : 'obj' },
        { name : 'stl (ascii)', format : OV.FileFormat.Text, extension : 'stl' },
        { name : 'stl (binary)', format : OV.FileFormat.Binary, extension : 'stl' },
        { name : 'ply (ascii)', format : OV.FileFormat.Text, extension : 'ply' },
        { name : 'ply (binary)', format : OV.FileFormat.Binary, extension : 'ply' },
        { name : 'off (ascii)', format : OV.FileFormat.Text, extension : 'off' }
    ];

    let formatSelect = $('<select>').addClass ('ov_dialog_select').appendTo (contentDiv);
    $('<option>').html ('Select format').appendTo (formatSelect);
    for (let i = 0; i < formats.length; i++) {
        let format = formats[i];
        $('<option>').html (format.name).appendTo (formatSelect);
    }

    let fileListSection = $('<div>').addClass ('ov_dialog_section').appendTo (contentDiv);
    let fileList = $('<div>').addClass ('ov_dialog_file_list').addClass ('ov_thin_scrollbar').appendTo (fileListSection);

    formatSelect.change (function () {
        fileList.empty ();
        let selectedIndex = formatSelect.prop ('selectedIndex');
        if (selectedIndex < 1) {
            return;
        }

        let selectedFormat = formats[selectedIndex - 1];
        fileList.html ('Please wait...');
        let taskRunner = new OV.TaskRunner ();
		taskRunner.Run (1, {
			runTask : function (index, ready) {
                let exporter = new OV.Exporter ();
                let files = exporter.Export (model, selectedFormat.format, selectedFormat.extension, null);
                fileList.empty ();
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    let url = file.GetUrl ();
                    if (url === null) {
                        let fileBlob = new Blob ([file.GetContent ()]);
                        url = URL.createObjectURL (fileBlob);
                    }
                    let fileLink = $('<a>').addClass ('ov_dialog_file_link').appendTo (fileList);
                    fileLink.attr ('href', url);
                    fileLink.attr ('download', file.GetName ());
                    $('<img>').addClass ('ov_dialog_file_link_icon').attr ('src', 'assets/images/dialog/file_download.svg').appendTo (fileLink);
                    $('<div>').addClass ('ov_dialog_file_link_text').html (file.GetName ()).appendTo (fileLink);
                }
                ready ();
            }
		});
    });

    dialog.Show ();
    return dialog;
};

OV.ShowEmbeddingDialog = function (importer, camera)
{
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
    let text = 'Here is the code for embedding.';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);

    let embeddingCode = '';
    embeddingCode += '<iframe';
    embeddingCode += ' width="640" height="480"';
    embeddingCode += ' style="border:1px solid #eeeeee;"';
    let hashParameters = OV.CreateHashParameters (modelFiles, camera);
    embeddingCode += ' src="https://3dviewer.net/embed.html#' + hashParameters + '">';
    embeddingCode += '</iframe>';

    urlsTextArea.val (embeddingCode);
    urlsTextArea.appendTo (contentDiv);
    let copyToClipboardText = 'copy to clipboard';
    let copiedToClipboardText = 'successfully copied';
    let innerButtonContainer = $('<div>').addClass ('ov_dialog_inner_buttons').appendTo (contentDiv);
    let copyButton = $('<div>').addClass ('ov_dialog_inner_button').html (copyToClipboardText).appendTo (innerButtonContainer);
    copyButton.click (function () {
        OV.CopyToClipboard (embeddingCode);
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
