OV.Modal = class
{
    constructor ()
    {
        this.modalDiv = $('<div>').css ('position', 'absolute');
        this.overlayDiv = null;
        this.resizeHandler = null;
        this.customResizeHandler = null;
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

    SetCustomResizeHandler (customResizeHandler)
    {
        this.customResizeHandler = customResizeHandler;
    }

    SetCloseHandler (closeHandler)
    {
        this.closeHandler = closeHandler;
    }

    Open ()
    {
        let windowObj = $(window);
        let bodyObj = $(document.body);

        this.overlayDiv = $('<div>').addClass ('ov_modal_overlay').css ('position', 'absolute').appendTo (bodyObj);
        this.modalDiv.appendTo (bodyObj);

        this.resizeHandler = this.Resize.bind (this);
        windowObj.bind ('resize', this.resizeHandler);
        if (this.closeable) {
            let obj = this;
            this.overlayDiv.click (function (ev) {
                obj.Close ();
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
        if (this.customResizeHandler) {
            this.customResizeHandler (this.modalDiv);
        } else {
            this.modalDiv.offset ({
                left : (windowWidth - this.modalDiv.outerWidth ()) / 2,
                top : (windowHeight - this.modalDiv.outerHeight ()) / 3
            });
        }
    }
};

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

    SetCloseHandler (closeHandler)
    {
        this.modal.SetCloseHandler (closeHandler);
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
