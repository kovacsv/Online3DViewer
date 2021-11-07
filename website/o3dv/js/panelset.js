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
        this.panelButtons = [];
        this.panelsVisible = true;
        this.panelsPrevWidth = null;
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
        this.panelButtons.push (button);
        button.click (() => {
            if (panel === this.GetVisiblePanel ()) {
                this.ShowPanels (false);
            } else {
                this.ShowPanels (true);
                this.ShowPanel (panel);
            }
        });
    }

    IsPanelsVisible ()
    {
        return this.panelsVisible;
    }

    ShowPanels (show)
    {
        if (this.panelsVisible === show) {
            return;
        }

        this.panelsVisible = show;
        if (this.panelsVisible) {
            this.contentDiv.show ();
            this.parentDiv.outerWidth (this.menuDiv.outerWidth (true) + this.panelsPrevWidth, true);
            this.callbacks.onResize ();
        } else {
            this.panelsPrevWidth = this.contentDiv.outerWidth (true);
            this.contentDiv.hide ();
            this.parentDiv.outerWidth (this.menuDiv.outerWidth (true), true);
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

    SetPanelIcon (panel, icon)
    {
        const panelIndex = this.panels.indexOf (panel);
        let panelButton = this.panelButtons[panelIndex];
        OV.SetSvgIconImage (panelButton, icon);
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
