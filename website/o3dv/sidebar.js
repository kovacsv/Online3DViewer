OV.SidebarPanelId =
{
    Properties : 0
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
            new OV.PropertySidebarPanel (this.parentDiv)
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

    Show (show)
    {
        this.visible = show;
        if (this.visible) {
            this.parentDiv.show ();
        } else {
            this.parentDiv.hide ();
        }
    }

    IsVisible ()
    {
        return this.visible;
    }

    Resize ()
    {
        for (let i = 0; i < this.panels.length; i++) {
            this.panels[i].Resize ();
        }        
    }
};
