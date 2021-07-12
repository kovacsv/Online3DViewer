OV.SidebarPanel = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.panelDiv = $('<div>').appendTo (this.parentDiv).hide ();
        this.titleDiv = null;
        this.contentDiv = null;
        this.visible = false;
    }

    Init (callbacks)
    {
        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').appendTo (this.panelDiv);
        this.contentDiv = $('<div>').addClass ('ov_sidebar_content').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        $('<div>').addClass ('ov_sidebar_title_text').html (this.GetTitle ()).appendTo (this.titleDiv);
        let titleImg = $('<img>').addClass ('ov_sidebar_title_img').attr ('src', 'assets/images/sidebar/close.svg').appendTo (this.titleDiv);
        titleImg.click (() => {
            callbacks.onClose ();
        });
    }

    GetTitle ()
    {
        return '';
    }

    Show (show)
    {
        this.visible = show;
        if (this.visible) {
            this.panelDiv.show ();
        } else {
            this.panelDiv.hide ();
        }
    }

    IsVisible ()
    {
        return this.visible;
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.contentDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        this.contentDiv.empty ();
    }
};
