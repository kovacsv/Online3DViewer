OV.SidebarSettingsPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv, settings)
    {
        super (parentDiv);
        this.settings = settings;
        this.backgroundColorInput = null;
        this.defaultColorInput = null;
        this.defaultColorWarning = null;
        this.edgeDisplayInput = null;
        this.themeInput = null;
    }

    GetName ()
    {
        return 'Settings';
    }

    GetIcon ()
    {
        return 'settings';
    }

    Clear ()
    {
        this.backgroundColorInput.pickr.hide ();
        this.defaultColorInput.pickr.hide ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.backgroundColorInput = this.AddColorParameter (
            'Background Color',
            'Affects only the visualization.',
            null,
            this.settings.backgroundColor,
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            (newColor) => {
                this.SetBackgroundColor (newColor, false);
            }
        );
        this.defaultColorInput = this.AddColorParameter (
            'Default Color',
            'Appears when the model doesn\'t have materials.',
            'Has no effect on the currently loaded file.',
            this.settings.defaultColor,
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            (newColor) => {
                this.SetDefaultColor (newColor, false);
            }
        );
        this.edgeDisplayInput = this.AddEdgeDisplayParameter (this.settings.showEdges, this.settings.edgeColor, this.settings.edgeThreshold);
        this.themeInput = this.AddThemeParameter (this.settings.themeId);
        this.AddResetToDefaultsButton ();
    }

    UpdateSettings (hasDefaultMaterial)
    {
        if (!hasDefaultMaterial) {
            OV.ShowDomElement (this.defaultColorInput.warning);
        } else {
            OV.HideDomElement (this.defaultColorInput.warning);
        }
        this.Resize ();
    }

    SetBackgroundColor (color, setInput)
    {
        this.settings.backgroundColor = color;
        if (setInput) {
            this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (color));
        } else {
            this.callbacks.onBackgroundColorChange ();
        }
    }

    SetDefaultColor (color, setInput)
    {
        this.settings.defaultColor = color;
        if (setInput) {
            this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (color));
        } else {
            this.callbacks.onDefaultColorChange ();
        }
    }

    AddColorPicker (parentDiv, defaultColor, predefinedColors, onChange)
    {
        let pickr = Pickr.create ({
            el : parentDiv,
            theme : 'monolith',
            position : 'left-start',
            swatches : predefinedColors,
            comparison : false,
            default : '#' + OV.ColorToHexString (defaultColor),
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

    AddColorParameter (title, description, warningText, defaultColor, predefinedColors, onChange)
    {
        let contentDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        let colorInput = OV.AddDiv (titleDiv, 'color-picker');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle', title);
        let pickr = this.AddColorPicker (colorInput, defaultColor, predefinedColors, (color) => {
            onChange (color);
        });
        OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded', description);
        let warningDiv = null;
        if (warningText !== null) {
            warningDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
            let icon = OV.AddSvgIconElement (warningDiv, 'warning', 'left_inline');
            icon.classList.add ('light');
            OV.AddDiv (warningDiv, 'ov_sidebar_settings_warning', warningText);
        }
        return {
            pickr : pickr,
            warning : warningDiv
        };
    }

    AddEdgeDisplayParameter (defaultShowEdges, defaultEdgeColor, defaultEdgeThreshold)
    {
        function AddRadioButton (contentDiv, id, text, onChange)
        {
            let row = OV.AddDiv (contentDiv, 'ov_sidebar_settings_row');
            return OV.AddRadioButton (row, 'edge_display', id, text, onChange);
        }

        function ShowEdgeSettings (edgeSettingsDiv, show)
        {
            if (show) {
                OV.ShowDomElement (edgeSettingsDiv);
            } else {
                OV.HideDomElement (edgeSettingsDiv);
            }
        }

        let contentDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        OV.AddSvgIconElement (titleDiv, 'edges', 'ov_sidebar_subtitle_icon');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Edge Display');

        let buttonsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        let edgeSettingsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');

        let colorRow = OV.AddDiv (edgeSettingsDiv, 'ov_sidebar_settings_row');
        OV.AddDiv (colorRow, 'ov_sidebar_settings_parameter_name', 'Edge Color');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];
        let colorInputDiv = OV.AddDiv (colorRow, 'ov_sidebar_settings_parameter_value');
        let colorInput = OV.AddDiv (colorInputDiv);
        let pickr = this.AddColorPicker (colorInput, defaultEdgeColor, predefinedEdgeColors, (color) => {
            this.settings.edgeColor = color;
            this.callbacks.onEdgeDisplayChange ();
        });

        let thresholdRow = OV.AddDiv (edgeSettingsDiv, 'ov_sidebar_settings_row');
        OV.AddDiv (thresholdRow, 'ov_sidebar_settings_parameter_name', 'Threshold Angle');
        let thresholdInputDiv = OV.AddDiv (thresholdRow, 'ov_sidebar_settings_parameter_value');
        let thresholdValues = [{
            value : '1',
            text : '1'
        }];
        for (let thresholdValue = 10; thresholdValue <= 180; thresholdValue += 10) {
            thresholdValues.push ({
                value : thresholdValue.toString (),
                text : thresholdValue.toString ()
            });
        }
        let thresholdSelect = OV.AddSelect (thresholdInputDiv, thresholdValues);
        thresholdSelect.addEventListener ('change', () => {
            this.settings.edgeThreshold = parseInt (thresholdSelect.value, 10);
            this.callbacks.onEdgeDisplayChange ();
        });
        thresholdSelect.value = defaultEdgeThreshold.toString ();

        let buttons = [];
        let offButton = AddRadioButton (buttonsDiv, 'off', 'Don\'t Show Edges', () => {
            OV.HideDomElement (edgeSettingsDiv);
            this.settings.showEdges = false;
            this.callbacks.onEdgeDisplayChange ();
        });
        let onButton = AddRadioButton (buttonsDiv, 'on', 'Show Edges', () => {
            OV.ShowDomElement (edgeSettingsDiv);
            this.settings.showEdges = true;
            this.callbacks.onEdgeDisplayChange ();
        });
        buttons.push (offButton);
        buttons.push (onButton);
        OV.SelectRadioButton (buttons, defaultShowEdges ? 'on' : 'off');
        ShowEdgeSettings (edgeSettingsDiv, defaultShowEdges);

        return {
            pickr : pickr,
            threshold : thresholdSelect,
            select : (value) => {
                OV.SelectRadioButton (buttons, value ? 'on' : 'off');
                ShowEdgeSettings (edgeSettingsDiv, value);
            }
        };
    }

    AddThemeParameter (defaultValue)
    {
        function AddRadioButton (contentDiv, themeId, themeName, onChange)
        {
            let row = OV.AddDiv (contentDiv, 'ov_sidebar_settings_row');
            return OV.AddRadioButton (row, 'theme', themeId.toString (), themeName, onChange);
        }

        let contentDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        OV.AddSvgIconElement (titleDiv, 'theme', 'ov_sidebar_subtitle_icon');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Appearance');

        let buttonsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        let buttons = [];
        let lightButton = AddRadioButton (buttonsDiv, OV.Theme.Light, 'Light', () => {
            this.SetBackgroundColor (new OV.Color (255, 255, 255), true);
            this.SetDefaultColor (new OV.Color (200, 200, 200), true);
            this.settings.themeId = OV.Theme.Light;
            this.callbacks.onThemeChange ();
        });
        let darkButton = AddRadioButton (buttonsDiv, OV.Theme.Dark, 'Dark', () => {
            this.SetBackgroundColor (new OV.Color (42, 43, 46), true);
            this.SetDefaultColor (new OV.Color (200, 200, 200), true);
            this.settings.themeId = OV.Theme.Dark;
            this.callbacks.onThemeChange ();
        });
        buttons.push (lightButton);
        buttons.push (darkButton);

        OV.SelectRadioButton (buttons, defaultValue.toString ());
        return {
            select : (value) => {
                OV.SelectRadioButton (buttons, value.toString ());
            }
        };
    }

    AddResetToDefaultsButton ()
    {
        let defaultSettings = new OV.Settings ();
        let resetToDefaultsButton = OV.AddDiv (this.contentDiv, 'ov_button outline ov_sidebar_button', 'Reset to Default');
        resetToDefaultsButton.addEventListener ('click', () => {
            this.settings.backgroundColor = defaultSettings.backgroundColor;
            this.settings.defaultColor = defaultSettings.defaultColor;
            this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));

            this.settings.showEdges = defaultSettings.showEdges;
            this.settings.edgeColor = defaultSettings.edgeColor;
            this.settings.edgeThreshold = defaultSettings.edgeThreshold;
            this.edgeDisplayInput.select (this.settings.showEdges);
            this.edgeDisplayInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.edgeColor));
            this.edgeDisplayInput.threshold.value = this.settings.edgeThreshold.toString ();
            this.callbacks.onEdgeDisplayChange ();

            this.settings.themeId = defaultSettings.themeId;
            this.themeInput.select (this.settings.themeId);
            this.callbacks.onThemeChange ();
        });
    }
};
