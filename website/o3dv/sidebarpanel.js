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

    Init (title, callbacks)
    {
        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').appendTo (this.panelDiv);
        this.contentDiv = $('<div>').addClass ('ov_sidebar_content').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        let titleTextDiv = $('<div>').addClass ('ov_sidebar_title_text').html (title).appendTo (this.titleDiv);
        let titleImg = $('<img>').addClass ('ov_sidebar_title_img').attr ('src', 'assets/images/sidebar/close.svg').appendTo (this.titleDiv);
        titleImg.click (function () {
            callbacks.onClose ();
        });
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
};
