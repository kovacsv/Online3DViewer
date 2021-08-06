
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
                OV.ReadLines (urlsTextArea.val (), (line) => {
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
    urlsTextArea.focus ();
    return dialog;
};
