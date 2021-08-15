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
        this.backgroundColorInput = this.AddColorParameters (
            'Background Color',
            'Changing the background color affects only the visualization.',
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            settings.backgroundColor,
            callbacks.onBackgroundColorChange
        );
        this.defaultColorInput = this.AddColorParameters (
            'Default Color',
            'Default color is used when no material was defined in the file.',
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            settings.defaultColor,
            callbacks.onDefaultColorChange
        );
        this.AddResetToDefaultsButton (defaultSettings, callbacks);
    }

    AddColorParameters (title, description, predefinedColors, defaultValue, onChange)
    {
        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        let titleDiv = $('<div>').addClass ('ov_sidebar_subtitle').appendTo (contentDiv);
        $('<div>').addClass ('ov_sidebar_settings_description').html (description).appendTo (contentDiv);
        let colorInput = $('<div>').addClass ('color-picker').addClass ('ov_sidebar_color').appendTo (titleDiv);
        $('<span>').html (title).appendTo (titleDiv);
        // TODO: pop up to the left
        const pickr = Pickr.create ({
            el : colorInput.get (0),
            theme : 'monolith',
            appClass : 'ov_sidebar_color',
            swatches : predefinedColors,
            comparison : false,
            default : '#' + OV.ColorToHexString (defaultValue),
            components : {
                preview : false,
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
        pickr.on ('change', (color, source, instance) => {
            let rgbaColor = color.toRGBA ();
            let ovColor = new OV.Color (
                parseInt (rgbaColor[0], 10),
                parseInt (rgbaColor[1], 10),
                parseInt (rgbaColor[2], 10)
            );
            onChange (ovColor);
        });
        return pickr;
    }

    AddResetToDefaultsButton (defaultSettings, callbacks)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_button').addClass ('outline').html ('Reset to Default').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.defaultColorInput.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            callbacks.onDefaultColorChange (defaultSettings.defaultColor);
        });
    }
};
