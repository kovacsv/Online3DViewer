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

OV.ShowListPopup = function (items, callbacks)
{
    if (items.length === 0) {
        return null;
    }

    let popup = new OV.ListPopup ();
    popup.Init (() => {
        return callbacks.calculatePosition (popup.GetContentDiv ());
    });
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

OV.CalculatePopupPositionToElementBottomRight = function (elementDiv, contentDiv)
{
    let offset = elementDiv.offset ();
    return {
        x : offset.left + elementDiv.outerWidth (false),
        y : offset.top + elementDiv.outerHeight (false) - contentDiv.outerHeight (true)
    };
};

OV.CalculatePopupPositionToScreen = function (globalMouseCoordinates, contentDiv)
{
    let windowObj = $(window);
    let windowWidth = windowObj.outerWidth ();
    let windowHeight = windowObj.outerHeight ();
    let left =  globalMouseCoordinates.x;               
    let top =  globalMouseCoordinates.y;
    let right = left + contentDiv.outerWidth (true);
    let bottom = top + contentDiv.outerHeight (true);
    if (right > windowWidth) {
        left = left - (right - windowWidth);
    }
    if (bottom > windowHeight) {
        top = top - (bottom - windowHeight);
    }
    return {
        x : left,
        y : top
    };
};
