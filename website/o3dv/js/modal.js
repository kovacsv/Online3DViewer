OV.Modal = class
{
    constructor ()
    {
        this.modalDiv = $('<div>').css ('position', 'absolute');
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
        let windowObj = $(window);
        let bodyObj = $(document.body);

        this.overlayDiv = $('<div>').addClass ('ov_modal_overlay').appendTo (bodyObj);
        this.modalDiv.appendTo (bodyObj);

        this.resizeHandler = this.Resize.bind (this);
        windowObj.bind ('resize', this.resizeHandler);
        if (this.closeable) {
            this.overlayDiv.click ((ev) => {
                ev.preventDefault ();
                this.Close ();
            });
            this.overlayDiv.contextmenu ((ev) => {
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

        let windowObj = $(window);
        windowObj.unbind ('resize', this.resizeHandler);
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
        let windowObj = $(window);
        let windowWidth = windowObj.outerWidth ();
        let windowHeight = windowObj.outerHeight ();
        this.overlayDiv.width (windowWidth);
        this.overlayDiv.height (windowHeight);
        this.overlayDiv.offset ({
            left : 0,
            top : 0
        });
        let positionX = (windowWidth - this.modalDiv.outerWidth ()) / 2;
        let positionY = (windowHeight - this.modalDiv.outerHeight ()) / 3;
        if (this.positionCalculator !== null) {
            let calculatedPosition = this.positionCalculator ();
            positionX = calculatedPosition.x;
            positionY = calculatedPosition.y;
        }
        this.modalDiv.offset ({
            left : positionX,
            top : positionY
        });
    }
};

OV.Dialog = class
{
    constructor ()
    {
        this.modal = new OV.Modal ();
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
};

OV.ProgressDialog = class extends OV.Dialog
{
    constructor ()
    {
        super ();
        this.modal.SetCloseable (false);
        this.imageDiv = null;
        this.textDiv = null;
    }

    Init (text)
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.addClass ('ov_progress');

        this.imageDiv = $('<img>').addClass ('ov_progress_img').attr ('src', 'assets/images/3dviewer_net_logo.svg').appendTo (contentDiv);
        this.textDiv = $('<div>').addClass ('ov_progress_text').appendTo (contentDiv);
        
        this.SetText (text);
    }

    SetText (text)
    {
        this.textDiv.html (text);
    }
};

OV.ButtonDialog = class extends OV.Dialog
{
    constructor ()
    {
        super ();
    }

    Init (title, buttons)
    {
        function AddButton (button, buttonsDiv)
        {
            let buttonDiv = $('<div>').addClass ('ov_button').addClass ('ov_dialog_button').html (button.name).appendTo (buttonsDiv);
            if (button.subClass) {
                buttonDiv.addClass (button.subClass);
            }
            buttonDiv.click (() => {
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
};

OV.PopupDialog = class extends OV.Dialog
{
    constructor ()
    {
        super ();
    }

    Init (positionCalculator)
    {
        let contentDiv = this.modal.GetContentDiv ();
        contentDiv.addClass ('ov_popup');
        this.modal.SetPositionCalculator (positionCalculator);
        return contentDiv;
    }
};

OV.ListPopup = class extends OV.PopupDialog
{
    constructor ()
    {
        super ();
        this.listDiv = null;
    }

    Init (positionCalculator)
    {
        let contentDiv = super.Init (positionCalculator);
        this.listDiv = $('<div>').addClass ('ov_popup_list').addClass ('ov_thin_scrollbar').appendTo (contentDiv);
        return contentDiv;
    }

    AddListItem (item, callbacks)
    {
        let listItemDiv = $('<div>').addClass ('ov_popup_list_item').appendTo (this.listDiv);
        if (item.icon) {
            OV.CreateSvgIcon (listItemDiv, item.icon, 'left_inline');
        }
        if (item.color) {
            let iconDiv = $('<div>').addClass ('ov_popup_list_item_icon').appendTo (listItemDiv);
            let colorCircle = OV.CreateInlineColorCircle (item.color);
            colorCircle.appendTo (iconDiv);
        }
        $('<div>').addClass ('ov_popup_list_item_name').html (item.name).appendTo (listItemDiv);
        listItemDiv.click (callbacks.onClick);
        if (OV.IsHoverEnabled () && callbacks.onHoverStart && callbacks.onHoverStop) {
            listItemDiv.hover (
                () => {
                    callbacks.onHoverStart ();
                },
                () => {
                    callbacks.onHoverStop ();
                }
            );
        }
    }
};
