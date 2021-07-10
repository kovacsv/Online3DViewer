OV.SettingsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetTitle ()
    {
        return 'Settings';
    }

    InitContent ()
    {
        this.contentDiv.html ('Settings Content...');
    }
};
