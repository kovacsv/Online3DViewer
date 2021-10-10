OV.SettingsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.backgroundColorInput = null;
        this.defaultColorInput = null;
        this.defaultColorWarning = null;
        this.themeInput = null;        
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
        this.themeInput = this.AddThemeParameter (settings.themeId, callbacks.onThemeChange);
        this.AddResetToDefaultsButton (defaultSettings, callbacks);
    }

    UpdateSettings (settings)
    {
        this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (settings.backgroundColor));
        this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (settings.defaultColor));
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
        let colorInput = $('<div>').addClass ('color-picker').appendTo (titleDiv);
        $('<span>').html (title).appendTo (titleDiv);
        const pickr = Pickr.create ({
            el : colorInput.get (0),
            theme : 'monolith',
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
        $('<div>').addClass ('ov_sidebar_settings_padded').html (description).appendTo (contentDiv);
        let warningDiv = null;
        if (warningText !== null) {
            warningDiv = $('<div>').addClass ('ov_sidebar_settings_padded').appendTo (contentDiv);
            OV.CreateSvgIcon (warningDiv, 'warning', 'left_inline light');
            $('<div>').addClass ('ov_sidebar_settings_warning').html (warningText).appendTo (warningDiv);
        }
        return {
            pickr : pickr,
            warning : warningDiv
        };
    }

    AddThemeParameter (defaultValue, onChange)
    {
        function AddRadioButton (contentDiv, themeId, themeName, onChange)
        {
            let row = $('<div>').addClass ('ov_sidebar_settings_row').appendTo (contentDiv);
            let label = $('<label>').attr ('for', themeId.toString ()).appendTo (row);
            let radio = $('<input>').addClass ('ov_radio_button').attr ('type', 'radio').attr ('id', themeId.toString ()).attr ('name', 'theme').appendTo (label);
            $('<span>').html (themeName).appendTo (label);
            radio.change (() => {
                onChange (themeId);
            });
            return radio;
        }

        function Select (radioButtons, defaultValue)
        {
            for (let i = 0; i < radioButtons.length; i++) {
                let radioButton = radioButtons[i];
                radioButton.prop ('checked', radioButton.attr ('id') === defaultValue.toString ());
            }
        }

        let contentDiv = $('<div>').addClass ('ov_sidebar_settings_content').appendTo (this.contentDiv);
        // TODO: icon
        let titleDiv = $('<div>').addClass ('ov_sidebar_subtitle').appendTo (contentDiv);
        OV.CreateSvgIcon (titleDiv, 'theme', 'ov_sidebar_subtitle_icon');
        $('<div>').html ('Appearance').appendTo (titleDiv);
        let buttonsDiv = $('<div>').addClass ('ov_sidebar_settings_padded').appendTo (contentDiv);
        let result = {
            buttons : [],
            select: (value) => {
                Select (result.buttons, value);
            }
        };
        result.buttons.push (AddRadioButton (buttonsDiv, OV.Theme.Light, 'Light', onChange));
        result.buttons.push (AddRadioButton (buttonsDiv, OV.Theme.Dark, 'Dark', onChange));
        Select (result.buttons, defaultValue);
        return result;

    }

    AddResetToDefaultsButton (defaultSettings, callbacks)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_button').addClass ('outline').addClass ('ov_sidebar_button').html ('Reset to Default').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            callbacks.onDefaultColorChange (defaultSettings.defaultColor);
            if (this.themeInput !== null) {
                this.themeInput.select (defaultSettings.themeId);
                callbacks.onThemeChange (defaultSettings.themeId);
            }
        });
    }
};
