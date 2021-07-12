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

    InitSettings (settings)
    {
        this.AddColorParameters (settings.backgroundColor, 'Background Color', 'Changing the background color affects only the visualization.');
        this.AddColorParameters (settings.defaultColor, 'Default Color', 'Default color is used when no material was defined in the file.');
    }

    AddColorParameters (params, title, description)
    {
        $('<div>').addClass ('ov_sidebar_subtitle').html (title).appendTo (this.contentDiv);
        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        let colorColumn = $('<div>').addClass ('ov_sidebar_small_column').appendTo (contentDiv);
        $('<div>').addClass ('ov_sidebar_column').html (description).appendTo (contentDiv);
        let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_sidebar_color').appendTo (colorColumn);
        colorInput.val ('#' + OV.ColorToHexString (params.defaultValue));
        colorInput.change (() => {
            let colorStr = colorInput.val ().substr (1);
            params.onChange (OV.HexStringToColor (colorStr));
        });
    }    
};
