OV.Sidebar = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.visible = true;
        this.titleDiv = null;
        this.contentDiv = null;
        this.panels = [];
    }

    AddPanel (panel)
    {
        this.panels.push (panel);
        return this.panels.length - 1;
    }

    GetPanel (id)
    {
        return this.panels[id];
    }

    Show (panelId)
    {
        if (panelId !== null) {
            this.visible = true;
            this.parentDiv.show ();
            for (let id = 0; id < this.panels.length; id++) {
                let panel = this.panels[id];
                if (id === panelId) {
                    panel.Show (true);
                } else {
                    panel.Show (false);
                }
            }
        } else {
            this.visible = false;
            this.parentDiv.hide ();
        }
    }

    IsVisible ()
    {
        return this.visible;
    }

    GetVisiblePanelId ()
    {
        if (!this.visible) {
            return null;
        }
        for (let id = 0; id < this.panels.length; id++) {
            if (this.panels[id].IsVisible ()) {
                return id;
            }
        }
        return null;
    }

    HidePopups ()
    {
        for (let id = 0; id < this.panels.length; id++) {
            this.panels[id].HidePopups ();
        }
    }
    
    Resize ()
    {
        for (let id = 0; id < this.panels.length; id++) {
            this.panels[id].Resize ();
        }
    }
};
