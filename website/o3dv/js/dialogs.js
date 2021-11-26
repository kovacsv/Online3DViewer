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
    OV.AddDiv (contentDiv, 'ov_dialog_message', message);
    if (subMessage !== null) {
        OV.AddDiv (contentDiv, 'ov_dialog_submessage', subMessage);
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
    let offset = elementDiv.getBoundingClientRect ();
    return {
        x : offset.left + elementDiv.offsetWidth,
        y : offset.top + elementDiv.offsetHeight - contentDiv.offsetHeight
    };
};

OV.CalculatePopupPositionToScreen = function (globalMouseCoordinates, contentDiv)
{
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let left =  globalMouseCoordinates.x;
    let top =  globalMouseCoordinates.y;
    let right = left + contentDiv.offsetWidth;
    let bottom = top + contentDiv.offsetHeight;
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
