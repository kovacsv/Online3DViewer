import { AddDiv } from '../engine/viewer/domutils.js';
import { ButtonDialog, ListPopup } from './modal.js';

export function ShowMessageDialog (title, message, subMessage)
{
    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init (title, [
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);
    AddDiv (contentDiv, 'ov_dialog_message', message);
    if (subMessage !== null) {
        AddDiv (contentDiv, 'ov_dialog_submessage', subMessage);
    }
    dialog.Show ();
    return dialog;
}

export function ShowListPopup (items, callbacks)
{
    if (items.length === 0) {
        return null;
    }

    let popup = new ListPopup ();
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
}

export function CalculatePopupPositionToElementBottomRight (elementDiv, contentDiv)
{
    let offset = elementDiv.getBoundingClientRect ();
    return {
        x : offset.left + elementDiv.offsetWidth,
        y : offset.top + elementDiv.offsetHeight - contentDiv.offsetHeight
    };
}

export function CalculatePopupPositionToScreen (globalMouseCoordinates, contentDiv)
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
}
