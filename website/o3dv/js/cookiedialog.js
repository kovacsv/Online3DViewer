OV.ShowCookieDialog = function (onAccept)
{
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Cookie Consent', [
        {
            name : 'Accept',
            onClick () {
                dialog.Hide ();
                onAccept ();
            }
        }
    ]);

    let text = 'This website uses cookies to offer you better user experience. See the details at the <a target="_blank" href="info/cookies.html">Cookies Policy</a> page.';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    dialog.SetCloseable (false);
    dialog.Show ();
    return dialog;
};
