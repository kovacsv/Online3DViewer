OV.Panel = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.panelDiv = $('<div>').appendTo (parentDiv).hide ();
        this.visible = false;
    }

    GetIcon ()
    {
        return null;
    }

    GetPanelDiv ()
    {
        return this.panelDiv;
    }

    IsVisible ()
    {
        return this.visible;
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

    Resize ()
    {

    }

    Clear ()
    {

    }
};

OV.PanelSet = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.menuDiv = $('<div>').addClass ('ov_panel_set_menu').appendTo (parentDiv);
        this.contentDiv = $('<div>').addClass ('ov_panel_set_content').appendTo (parentDiv);
        this.panels = [];
    }

    GetContentDiv ()
    {
        return this.contentDiv;
    }

    AddPanel (panel)
    {
        this.panels.push (panel);
        let button = OV.AddSvgIcon (this.menuDiv, panel.GetIcon (), 'ov_panel_set_menu_button');
        button.click (() => {
            this.ShowPanel (panel);
        });
    }

    ShowPanel (panel)
    {
        for (let otherPanel of this.panels) {
            otherPanel.Show (false);
        }
        panel.Show (true);
        panel.Resize ();
    }

    GetVisiblePanel ()
    {
        for (let panel of this.panels) {
            if (panel.IsVisible ()) {
                return panel;
            }
        }
        return null;
    }

    Resize ()
    {
        let height = this.parentDiv.height ();
        this.menuDiv.outerHeight (height, true);
        this.contentDiv.outerHeight (height, true);
        for (let panel of this.panels) {
            panel.Resize ();
        }
    }

    Clear ()
    {
        for (let panel of this.panels) {
            panel.Clear ();
        }
    }
};
