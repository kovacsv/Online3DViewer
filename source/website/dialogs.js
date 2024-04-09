import { AddDiv } from '../engine/viewer/domutils.js';
import { ButtonDialog, ListPopup } from './dialog.js';

import { t } from './i18next.js';

export function ShowMessageDialog (title, message, subMessage)
{
    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init (title, [
        {
            name : t('OK'),
            onClick () {
                dialog.Close ();
            }
        }
    ]);
    AddDiv (contentDiv, 'ov_dialog_message', message);
    if (subMessage !== null) {
        AddDiv (contentDiv, 'ov_dialog_submessage', subMessage);
    }
    dialog.Open ();
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
                popup.Close ();
                callbacks.onClick (i);
            }
        });
    }
    popup.Open ();
    return popup;
}

export function CalculatePopupPositionToElementTopLeft (elementDiv, contentDiv)
{
    let offset = elementDiv.getBoundingClientRect ();
    return {
        x : offset.left - contentDiv.offsetWidth,
        y : offset.top
    };
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
