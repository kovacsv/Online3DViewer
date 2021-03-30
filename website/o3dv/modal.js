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
