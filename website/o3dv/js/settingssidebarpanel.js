OV.SettingsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.backgroundColorInput = null;
        this.defaultColorInput = null;
        this.defaultColorWarning = null;
    }

    GetTitle ()
    {
        return 'Settings';
    }

    HidePopups ()
    {
        this.backgroundColorInput.pickr.hide ();
        this.defaultColorInput.pickr.hide ();
    }

    InitSettings (settings, defaultSettings, callbacks)
    {
        this.backgroundColorInput = this.AddColorParameter (
            'Background Color',
            'Background color affects only the visualization of the model.',
            null,
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            settings.backgroundColor,
            callbacks.onBackgroundColorChange
        );
        this.defaultColorInput = this.AddColorParameter (
            'Default Color',
            'Default color appears when the model doesn\'t contain materials.',
            'This setting has no effect on the currently loaded file.',
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            settings.defaultColor,
            callbacks.onDefaultColorChange
        );
        this.AddResetToDefaultsButton (defaultSettings, callbacks);
    }

    Update (model)
    {
        let hasDefaultMaterial = OV.HasDefaultMaterial (model);
        if (!hasDefaultMaterial) {
            this.defaultColorInput.warning.show ();
        } else {
            this.defaultColorInput.warning.hide ();
        }
        this.Resize ();
    }

    AddColorParameter (title, description, warningText, predefinedColors, defaultValue, onChange)
    {
        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        let titleDiv = $('<div>').addClass ('ov_sidebar_subtitle').appendTo (contentDiv);
        let colorInput = $('<div>').addClass ('color-picker').addClass ('ov_sidebar_color').appendTo (titleDiv);
        $('<span>').html (title).appendTo (titleDiv);
        const pickr = Pickr.create ({
            el : colorInput.get (0),
            theme : 'monolith',
            appClass : 'ov_sidebar_color',
            position : 'left-start',
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
        $('<div>').addClass ('ov_sidebar_settings_description').html (description).appendTo (contentDiv);
        let warningDiv = null;
        if (warningText !== null) {
            warningDiv = $('<div>').addClass ('ov_sidebar_settings_description').appendTo (contentDiv);
            OV.CreateSvgIcon (warningDiv, 'warning', 'left_inline light');
            $('<div>').addClass ('ov_sidebar_settings_warning').html (warningText).appendTo (warningDiv);
        }
        return {
            pickr : pickr,
            warning : warningDiv
        };
    }

    AddResetToDefaultsButton (defaultSettings, callbacks)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_button').addClass ('outline').addClass ('ov_sidebar_button').html ('Reset to Default').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            callbacks.onDefaultColorChange (defaultSettings.defaultColor);
        });
    }
};
