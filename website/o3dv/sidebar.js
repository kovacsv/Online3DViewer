OV.SidebarPanelId =
{
    Details : 0
};

OV.Sidebar = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.visible = true;
        this.titleDiv = null;
        this.contentDiv = null;
        this.panels = [
            new OV.DetailsSidebarPanel (this.parentDiv)
        ];
    }

    GetPanel (id)
    {
        return this.panels[id];
    }

    Init (callbacks)
    {
        for (let i = 0; i < this.panels.length; i++) {
            this.panels[i].Init ('Details', callbacks);
        }
    }

    Show (panelId)
    {
        if (panelId !== null) {
            this.visible = true;
            this.parentDiv.show ();
            for (let i = 0; i < this.panels.length; i++) {
                const panel = this.panels[i];
                if (i === panelId) {
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
        for (let i = 0; i < this.panels.length; i++) {
            if (this.panels[i].IsVisible ()) {
                return i;
            }
        }
        return null;
    }

    Resize ()
    {
        for (let i = 0; i < this.panels.length; i++) {
            this.panels[i].Resize ();
        }        
    }
};
