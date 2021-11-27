OV.Panel = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.panelDiv = OV.AddDiv (parentDiv);
        OV.HideDomElement (this.panelDiv);
        this.visible = false;
    }

    GetIcon ()
    {
        return null;
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
            OV.ShowDomElement (this.panelDiv);
        } else {
            OV.HideDomElement (this.panelDiv);
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
        this.menuDiv = OV.AddDiv (parentDiv, 'ov_panel_set_menu');
        this.contentDiv = OV.AddDiv (parentDiv, 'ov_panel_set_content ov_thin_scrollbar');
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
        let button = OV.AddSvgIconElement (this.menuDiv, panel.GetIcon (), 'ov_panel_set_menu_button');
        button.setAttribute ('alt', panel.GetName ());
        button.setAttribute ('title', panel.GetName ());
        this.panelButtons.push (button);
        button.addEventListener ('click', () => {
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
        if (!this.IsParentVisible ()) {
            return;
        }

        if (this.panelsVisible === show) {
            return;
        }

        this.panelsVisible = show;
        if (this.panelsVisible) {
            OV.ShowDomElement (this.contentDiv);
            OV.SetDomElementWidth (this.parentDiv, this.menuDiv.offsetWidth + this.panelsPrevWidth);
        } else {
            for (let panelButton of this.panelButtons) {
                panelButton.classList.remove ('selected');
            }
            for (let panel of this.panels) {
                panel.Show (false);
            }
            this.panelsPrevWidth = this.contentDiv.offsetWidth;
            OV.SetDomElementWidth (this.parentDiv, this.menuDiv.offsetWidth);
            OV.HideDomElement (this.contentDiv);
        }

        this.callbacks.onShowHidePanels (this.panelsVisible);
        this.callbacks.onResize ();
    }

    ShowPanel (panel)
    {
        if (panel === this.GetVisiblePanel ()) {
            return;
        }

        let panelButton = this.GetPanelButton (panel);
        for (let otherPanelButton of this.panelButtons) {
            if (otherPanelButton !== panelButton) {
                otherPanelButton.classList.remove ('selected');
            }
        }
        panelButton.classList.add ('selected');

        for (let otherPanel of this.panels) {
            if (otherPanel !== panel) {
                otherPanel.Show (false);
            }
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
        let panelButton = this.GetPanelButton (panel);
        OV.SetSvgIconImageElement (panelButton, icon);
    }

    GetPanelButton (panel)
    {
        const panelIndex = this.panels.indexOf (panel);
        return this.panelButtons[panelIndex];
    }

    Resize ()
    {
        let height = this.parentDiv.offsetHeight;
        OV.SetDomElementHeight (this.menuDiv, height);
        OV.SetDomElementHeight (this.contentDiv, height);
        if (this.panelsVisible) {
            for (let panel of this.panels) {
                if (panel.IsVisible ()) {
                    panel.Resize ();
                }
            }
        }
    }

    IsParentVisible ()
    {
        return OV.IsDomElementVisible (this.parentDiv);
    }

    Clear ()
    {
        for (let panel of this.panels) {
            panel.Clear ();
        }
    }
};
