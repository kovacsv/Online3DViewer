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
        if (this.visible === show) {
            return;
        }

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
        this.panelsVisible = true;
        this.callbacks = null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
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
            if (panel === this.GetVisiblePanel ()) {
                //this.ShowPanels (false);
            } else {
                //this.ShowPanels (true);
                this.ShowPanel (panel);
            }
        });
    }

    ShowPanels (show)
    {
        if (this.panelsVisible === show) {
            return;
        }

        this.panelsVisible = show;
        if (this.panelsVisible) {
            this.contentDiv.show ();
        } else {
            this.contentDiv.hide ();
            this.callbacks.onResize ();
        }
    }

    ShowPanel (panel)
    {
        if (panel === this.GetVisiblePanel ()) {
            return;
        }
        for (let otherPanel of this.panels) {
            otherPanel.Show (false);
        }
        panel.Show (true);
        panel.Resize ();
    }

    GetVisiblePanel ()
    {
        if (!this.panelsVisible) {
            return null;
        }
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
