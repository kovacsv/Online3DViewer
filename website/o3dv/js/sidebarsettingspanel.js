OV.AddColorPicker = function (parentDiv, defaultColor, predefinedColors, onChange)
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
};

OV.SettingsColorSection = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.contentDiv = null;
        this.pickr = null;
    }

    Init (title, description, color, predefinedColors, onChange)
    {
        this.contentDiv = OV.AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_subtitle');
        let colorInput = OV.AddDiv (titleDiv, 'ov_color_picker');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle', title);
        this.pickr = OV.AddColorPicker (colorInput, color, predefinedColors, (color) => {
            onChange (color);
        });
        OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_padded', description);
    }

    Show (show)
    {
        OV.ShowDomElement (this.contentDiv, show);
    }

    Update (color)
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.setColor ('#' + OV.ColorToHexString (color));
    }

    Clear ()
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.hide ();
    }
};

OV.SettingsEdgeDisplaySection = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.buttons = null;
        this.pickr = null;
        this.thresholdSlider = null;
        this.thresholdSliderValue = null;
        this.edgeSettingsDiv = null;
    }

    Init (showEdges, edgeColor, edgeThreshold, callbacks)
    {
        function AddRadioButton (contentDiv, id, text, onChange)
        {
            let row = OV.AddDiv (contentDiv, 'ov_sidebar_settings_row');
            return OV.AddRadioButton (row, 'edge_display', id, text, onChange);
        }

        let contentDiv = OV.AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        OV.AddSvgIconElement (titleDiv, 'edges', 'ov_sidebar_subtitle_icon');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Edge Display');

        let buttonsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        this.edgeSettingsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');

        let edgeColorRow = OV.AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];

        let colorInput = OV.AddDiv (edgeColorRow, 'ov_color_picker');
        this.pickr = OV.AddColorPicker (colorInput, edgeColor, predefinedEdgeColors, (color) => {
            callbacks.onEdgeColorChange (color);
        });
        OV.AddDiv (edgeColorRow, null, 'Edge Color');

        let thresholdRow = OV.AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row large');
        this.thresholdSlider = OV.AddRangeSlider (thresholdRow, 0, 90);
        this.thresholdSlider.setAttribute ('title', 'Edge Angle Threshold');
        this.thresholdSliderValue = OV.AddDomElement (thresholdRow, 'span', 'ov_slider_label');
        this.thresholdSlider.addEventListener ('input', () => {
            this.thresholdSliderValue.innerHTML = this.thresholdSlider.value;
        });
        this. thresholdSlider.addEventListener ('change', () => {
            callbacks.onEdgeThresholdChange (this.thresholdSlider.value);
        });
        this.thresholdSlider.value = edgeThreshold;
        this.thresholdSliderValue.innerHTML = edgeThreshold;

        this.buttons = [];
        let offButton = AddRadioButton (buttonsDiv, 'off', 'Don\'t Show Edges', () => {
            OV.ShowDomElement (this.edgeSettingsDiv, false);
            callbacks.onShowEdgesChange (false);
        });
        let onButton = AddRadioButton (buttonsDiv, 'on', 'Show Edges', () => {
            OV.ShowDomElement (this.edgeSettingsDiv, true);
            callbacks.onShowEdgesChange (true);
        });
        this.buttons.push (offButton);
        this.buttons.push (onButton);

        OV.SelectRadioButton (this.buttons, showEdges ? 'on' : 'off');
        this.ShowEdgeSettings (showEdges);
    }

    Update (showEdges, edgeColor, edgeThreshold)
    {
        if (this.buttons === null) {
            return;
        }
        OV.SelectRadioButton (this.buttons, showEdges ? 'on' : 'off');
        this.ShowEdgeSettings (showEdges);
        this.pickr.setColor ('#' + OV.ColorToHexString (edgeColor));
        this.thresholdSlider.value = edgeThreshold;
        this.thresholdSliderValue.innerHTML = edgeThreshold;
    }

    ShowEdgeSettings (show)
    {
        OV.ShowDomElement (this.edgeSettingsDiv, show);
    }

    Clear ()
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.hide ();
    }
};

OV.SettingsThemeSection = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.buttons = null;
    }

    Init (themeId, onChange)
    {
        function AddRadioButton (contentDiv, themeId, themeName, onChange)
        {
            let row = OV.AddDiv (contentDiv, 'ov_sidebar_settings_row');
            return OV.AddRadioButton (row, 'theme', themeId.toString (), themeName, onChange);
        }

        let contentDiv = OV.AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        OV.AddSvgIconElement (titleDiv, 'theme', 'ov_sidebar_subtitle_icon');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Appearance');

        let buttonsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        this.buttons = [];
        let lightButton = AddRadioButton (buttonsDiv, OV.Theme.Light, 'Light', () => {
            onChange (OV.Theme.Light);
        });
        let darkButton = AddRadioButton (buttonsDiv, OV.Theme.Dark, 'Dark', () => {
            onChange (OV.Theme.Dark);
        });
        this.buttons.push (lightButton);
        this.buttons.push (darkButton);

        OV.SelectRadioButton (this.buttons, themeId.toString ());
    }

    Update (themeId)
    {
        if (this.buttons === null) {
            return;
        }
        OV.SelectRadioButton (this.buttons, themeId.toString ());
    }
};

OV.SidebarSettingsPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv, settings)
    {
        super (parentDiv);
        this.settings = settings;

        this.sectionsDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_sections ov_thin_scrollbar');
        this.backgroundColorSection = new OV.SettingsColorSection (this.sectionsDiv);
        this.defaultColorSection = new OV.SettingsColorSection (this.sectionsDiv);
        this.edgeDisplaySection = new OV.SettingsEdgeDisplaySection (this.sectionsDiv);
        this.themeSection = new OV.SettingsThemeSection (this.sectionsDiv);

        this.resetToDefaultsButton = OV.AddDiv (this.contentDiv, 'ov_button ov_sidebar_button outline', 'Reset to Default');
        this.resetToDefaultsButton.addEventListener ('click', () => {
            this.ResetToDefaults ();
        });
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
        this.backgroundColorSection.Clear ();
        this.defaultColorSection.Clear ();
        this.edgeDisplaySection.Clear ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.backgroundColorSection.Init (
            'Background Color',
            'Affects only the visualization.',
            this.settings.backgroundColor,
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            (newColor) => {
                this.SetBackgroundColor (newColor, false);
            }
        );
        this.defaultColorSection.Init (
            'Default Color',
            'Appears when the model doesn\'t have materials.',
            this.settings.defaultColor,
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            (newColor) => {
                this.SetDefaultColor (newColor, false);
            }
        );
        this.edgeDisplaySection.Init (
            this.settings.showEdges,
            this.settings.edgeColor,
            this.settings.edgeThreshold,
            {
                onShowEdgesChange : (showEdges) => {
                    this.settings.showEdges = showEdges;
                    callbacks.onEdgeDisplayChange ();
                },
                onEdgeColorChange : (edgeColor) => {
                    this.settings.edgeColor = edgeColor;
                    callbacks.onEdgeDisplayChange ();
                },
                onEdgeThresholdChange : (edgeThreshold) => {
                    this.settings.edgeThreshold = edgeThreshold;
                    callbacks.onEdgeDisplayChange ();
                }
            }
        );
        this.themeSection.Init (this.settings.themeId, (themeId) => {
            this.settings.themeId = themeId;
            if (themeId === OV.Theme.Light) {
                this.SetBackgroundColor (new OV.Color (255, 255, 255), true);
                this.SetDefaultColor (new OV.Color (200, 200, 200), true);
            } else if (themeId === OV.Theme.Dark) {
                this.SetBackgroundColor (new OV.Color (42, 43, 46), true);
                this.SetDefaultColor (new OV.Color (200, 200, 200), true);
            }
            callbacks.onThemeChange ();
        });
    }

    UpdateSettings (hasDefaultMaterial)
    {
        this.defaultColorSection.Show (hasDefaultMaterial);
        this.Resize ();
    }

    SetBackgroundColor (color, setInput)
    {
        this.settings.backgroundColor = color;
        if (setInput) {
            this.backgroundColorSection.Update (color);
        } else {
            this.callbacks.onBackgroundColorChange ();
        }
    }

    SetDefaultColor (color, setInput)
    {
        this.settings.defaultColor = color;
        if (setInput) {
            this.defaultColorSection.Update (color);
        } else {
            this.callbacks.onDefaultColorChange ();
        }
    }

    ResetToDefaults ()
    {
        let defaultSettings = new OV.Settings ();

        this.settings.backgroundColor = defaultSettings.backgroundColor;
        this.settings.defaultColor = defaultSettings.defaultColor;
        this.settings.showEdges = defaultSettings.showEdges;
        this.settings.edgeColor = defaultSettings.edgeColor;
        this.settings.edgeThreshold = defaultSettings.edgeThreshold;
        this.settings.themeId = defaultSettings.themeId;

        this.backgroundColorSection.Update (defaultSettings.backgroundColor);
        this.defaultColorSection.Update (defaultSettings.defaultColor);
        this.edgeDisplaySection.Update (defaultSettings.showEdges, defaultSettings.edgeColor, defaultSettings.edgeThreshold);
        this.themeSection.Update (defaultSettings.themeId);
        this.callbacks.onThemeChange ();
    }

    Resize ()
    {
        let titleHeight = OV.GetDomElementOuterHeight (this.titleDiv);
        let resetButtonHeight = OV.GetDomElementOuterHeight (this.resetToDefaultsButton);
        let height = this.parentDiv.offsetHeight;
        OV.SetDomElementOuterHeight (this.sectionsDiv, height - titleHeight - resetButtonHeight);
    }
};
