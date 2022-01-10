import { AddDiv, CreateDiv } from '../engine/viewer/domutils.js';
import { AddSvgIconElement, CreateInlineColorCircle, IsHoverEnabled } from './utils.js';

export class Modal
{
    constructor ()
    {
        this.modalDiv = CreateDiv ('ov_modal');
        this.overlayDiv = null;
        this.resizeHandler = null;
        this.positionCalculator = null;
        this.closeHandler = null;
        this.isOpen = false;
        this.closeable = true;
    }

    GetContentDiv ()
    {
        return this.modalDiv;
    }

    SetCloseable (closeable)
    {
        this.closeable = closeable;
    }

    SetPositionCalculator (positionCalculator)
    {
        this.positionCalculator = positionCalculator;
    }

    SetCloseHandler (closeHandler)
    {
        this.closeHandler = closeHandler;
    }

    Open ()
    {
        this.overlayDiv = AddDiv (document.body, 'ov_modal_overlay');
        document.body.appendChild (this.modalDiv);

        this.resizeHandler = this.Resize.bind (this);
        window.addEventListener ('resize', this.resizeHandler);
        if (this.closeable) {
            this.overlayDiv.addEventListener ('click', (ev) => {
                ev.preventDefault ();
                this.Close ();
            });
            this.overlayDiv.addEventListener ('contextmenu', (ev) => {
                ev.preventDefault ();
                this.Close ();
            });
        }

        this.isOpen = true;
        this.Resize ();
    }

    Close ()
    {
        if (!this.isOpen) {
            return;
        }

        window.removeEventListener ('resize', this.resizeHandler);
        if (this.closeHandler !== null) {
            this.closeHandler ();
        }

        this.modalDiv.remove ();
        this.overlayDiv.remove ();

        this.overlayDiv = null;
        this.resizeHandler = null;
        this.isOpen = false;
    }

    IsOpen ()
    {
        return this.isOpen;
    }

    Resize ()
    {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let positionX = (windowWidth - this.modalDiv.offsetWidth) / 2;
        let positionY = (windowHeight - this.modalDiv.offsetHeight) / 3;
        if (this.positionCalculator !== null) {
            let calculatedPosition = this.positionCalculator ();
            positionX = calculatedPosition.x;
            positionY = calculatedPosition.y;
        }
        this.modalDiv.style.left = positionX + 'px';
        this.modalDiv.style.top = positionY + 'px';
    }
}

export class Dialog
{
    constructor ()
    {
        this.modal = new Modal ();
    }

    GetContentDiv ()
    {
        return this.modal.GetContentDiv ();
    }

    SetCloseable (closeable)
    {
        this.modal.SetCloseable (closeable);
    }

    SetCloseHandler (closeHandler)
    {
        this.modal.SetCloseHandler (closeHandler);
    }

    SetPositionCalculator (positionCalculator)
    {
        this.modal.SetPositionCalculator (positionCalculator);
    }

    Show ()
    {
        this.modal.Open ();
    }

    Hide ()
    {
        this.modal.Close ();
    }
}

export class ProgressDialog extends Dialog
{
    constructor ()
    {
        super ();
        this.modal.SetCloseable (false);
        this.textDiv = null;
    }

    Init (text)
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.classList.add ('ov_progress');

        AddDiv (contentDiv, 'ov_progress_img', '<svg><use href="assets/images/3dviewer_net_logo.svg#logo"></use></svg>');
        this.textDiv = AddDiv (contentDiv, 'ov_progress_text');
        this.SetText (text);
    }

    SetText (text)
    {
        this.textDiv.innerHTML = text;
    }
}

export class ButtonDialog extends Dialog
{
    constructor ()
    {
        super ();
    }

    Init (title, buttons)
    {
        function AddButton (button, buttonsDiv)
        {
            let buttonDiv = AddDiv (buttonsDiv, 'ov_button ov_dialog_button', button.name);
            if (button.subClass) {
                buttonDiv.classList.add (button.subClass);
            }
            buttonDiv.addEventListener ('click', () => {
                button.onClick ();
            });
        }

        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.classList.add ('ov_dialog');

        AddDiv (contentDiv, 'ov_dialog_title', title);
        let dialogContentDiv = AddDiv (contentDiv, 'ov_dialog_content');
        let buttonsDiv = AddDiv (contentDiv, 'ov_dialog_buttons');
        let buttonsInnerDiv = AddDiv (buttonsDiv, 'ov_dialog_buttons_inner');
        for (let i = 0; i < buttons.length; i++) {
            AddButton (buttons[i], buttonsInnerDiv);
        }

        return dialogContentDiv;
    }
}

export class PopupDialog extends Dialog
{
    constructor ()
    {
        super ();
    }

    Init (positionCalculator)
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.classList.add ('ov_popup');
        this.modal.SetPositionCalculator (positionCalculator);
        return contentDiv;
    }
}

export class ListPopup extends PopupDialog
{
    constructor ()
    {
        super ();
        this.listDiv = null;
    }

    Init (positionCalculator)
    {
        let contentDiv = super.Init (positionCalculator);
        this.listDiv = AddDiv (contentDiv, 'ov_popup_list ov_thin_scrollbar');
        return contentDiv;
    }

    AddListItem (item, callbacks)
    {
        let listItemDiv = AddDiv (this.listDiv, 'ov_popup_list_item');
        if (item.icon) {
            AddSvgIconElement (listItemDiv, item.icon, 'left_inline');
        }
        if (item.color) {
            let iconDiv = AddDiv (listItemDiv, 'ov_popup_list_item_icon');
            let colorCircle = CreateInlineColorCircle (item.color);
            iconDiv.appendChild (colorCircle);
        }
        AddDiv (listItemDiv, 'ov_popup_list_item_name', item.name);
        listItemDiv.addEventListener ('click', callbacks.onClick);
        if (IsHoverEnabled () && callbacks.onHoverStart && callbacks.onHoverStop) {
            listItemDiv.addEventListener ('mouseover', () => {
                callbacks.onHoverStart ();
            });
            listItemDiv.addEventListener ('mouseout', () => {
                callbacks.onHoverStop ();
            });
        }
    }
}
