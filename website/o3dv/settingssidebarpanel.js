OV.SettingsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.backgroundColorInput = null;
        this.defaultColorInput = null;
    }

    GetTitle ()
    {
        return 'Settings';
    }

    InitSettings (settings, defaultSettings, callbacks)
    {
        this.backgroundColorInput = this.AddColorParameters ('Background Color', 'Changing the background color affects only the visualization.', settings.backgroundColor, callbacks.onBackgroundColorChange);
        this.defaultColorInput = this.AddColorParameters ('Default Color', 'Default color is used when no material was defined in the file.', settings.defaultColor, callbacks.onDefaultColorChange);

        this.AddResetToDefaultsButton (defaultSettings, callbacks);
    }

    AddColorParameters (title, description, defaultValue, onChange)
    {
        $('<div>').addClass ('ov_sidebar_subtitle').html (title).appendTo (this.contentDiv);
        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        let colorColumn = $('<div>').addClass ('ov_sidebar_small_column').appendTo (contentDiv);
        $('<div>').addClass ('ov_sidebar_column').html (description).appendTo (contentDiv);
        let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_sidebar_color').appendTo (colorColumn);
        colorInput.val ('#' + OV.ColorToHexString (defaultValue));
        colorInput.change (() => {
            let colorStr = colorInput.val ().substr (1);
            onChange (OV.HexStringToColor (colorStr));
        });
        return colorInput;
    }

    AddResetToDefaultsButton (defaultSettings, callbacks)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_sidebar_settings_button').html ('Reset to Defaults').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.val ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.defaultColorInput.val ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            callbacks.onDefaultColorChange (defaultSettings.defaultColor);
        });
    }
};
