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

    HidePopups ()
    {
        this.backgroundColorInput.hide ();
        this.defaultColorInput.hide ();
    }

    InitSettings (settings, defaultSettings, callbacks)
    {
        this.backgroundColorInput = this.AddColorParameters ('Background Color', 'Changing the background color affects only the visualization.', settings.backgroundColor, callbacks.onBackgroundColorChange);
        this.defaultColorInput = this.AddColorParameters ('Default Color', 'Default color is used when no material was defined in the file.', settings.defaultColor, callbacks.onDefaultColorChange);
        this.AddResetToDefaultsButton (defaultSettings, callbacks);
    }

    AddColorParameters (title, description, defaultValue, onChange)
    {
        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        let titleDiv = $('<div>').addClass ('ov_sidebar_subtitle').appendTo (contentDiv);
        $('<div>').addClass ('ov_sidebar_settings_description').html (description).appendTo (contentDiv);
        let colorInput = $('<div>').addClass ('color-picker').addClass ('ov_sidebar_color').appendTo (titleDiv);
        $('<span>').html (title).appendTo (titleDiv);
        const pickr = Pickr.create ({
            el : colorInput.get (0),
            theme : 'monolith',
            appClass : 'ov_sidebar_color',
            swatches : [
                '#225588',
                '#225588',
                '#225588',
                '#225588',
                '#225588',
                '#225588',
                '#225588',
                '#225588',
            ],
            comparison : false,
            default : '#' + OV.ColorToHexString (defaultValue),
            components : {
                preview : true,
                opacity : false,
                hue : true,
                interaction: {
                    hex : false,
                    rgba : false,
                    hsla : false,
                    hsva : false,
                    cmyk : false,
                    input : true,
                    clear : false,
                    save : false
                }
            }
        });
        let selectedColor = null;
        pickr.on ('change', (color, source, instance) => {
            selectedColor = color;
            let rgbaColor = selectedColor.toRGBA ();
            let color2 = new OV.Color (rgbaColor[0], rgbaColor[1], rgbaColor[2]);
            onChange (color2);
    }).on ('hide', instance => {
            if (selectedColor !== null) {
                let rgbaColor = selectedColor.toRGBA ();
                let color = new OV.Color (rgbaColor[0], rgbaColor[1], rgbaColor[2]);
                onChange (color);
            }
            console.log ('Event: "hide"', instance);
        });
        return pickr;
    }

    AddResetToDefaultsButton (defaultSettings, callbacks)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_sidebar_settings_button').html ('Reset to Default').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.defaultColorInput.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            callbacks.onDefaultColorChange (defaultSettings.defaultColor);
        });
    }
};
