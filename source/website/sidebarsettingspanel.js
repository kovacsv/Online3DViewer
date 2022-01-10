import { Color, ColorToHexString } from '../engine/model/color.js';
import { AddDiv, AddDomElement, AddRangeSlider, AddToggle, ShowDomElement, GetDomElementOuterHeight, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { FeatureSet } from './featureset.js';
import { Settings, Theme } from './settings.js';
import { SidebarPanel } from './sidebarpanel.js';

export function AddColorPicker (parentDiv, defaultColor, predefinedColors, onChange)
{
    let pickr = Pickr.create ({
        el : parentDiv,
        theme : 'monolith',
        position : 'left-start',
        swatches : predefinedColors,
        comparison : false,
        default : '#' + ColorToHexString (defaultColor),
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
        let ovColor = new Color (
            parseInt (rgbaColor[0], 10),
            parseInt (rgbaColor[1], 10),
            parseInt (rgbaColor[2], 10)
        );
        onChange (ovColor);
    });
    return pickr;
}

export class SettingsColorSection
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.contentDiv = null;
        this.pickr = null;
    }

    Init (title, description, color, predefinedColors, onChange)
    {
        this.contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = AddDiv (this.contentDiv, 'ov_sidebar_subtitle');
        let colorInput = AddDiv (titleDiv, 'ov_color_picker');
        AddDiv (titleDiv, 'ov_sidebar_subtitle', title);
        this.pickr = AddColorPicker (colorInput, color, predefinedColors, (color) => {
            onChange (color);
        });
        AddDiv (this.contentDiv, 'ov_sidebar_settings_padded', description);
    }

    Show (show)
    {
        ShowDomElement (this.contentDiv, show);
    }

    Update (color)
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.setColor ('#' + ColorToHexString (color));
    }

    Clear ()
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.hide ();
    }
}

export class SettingsGridDisplaySection
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.gridDisplayToggle = null;
    }

    Init (showGrid, onChange)
    {
        let contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = AddDiv (contentDiv, 'ov_sidebar_subtitle');

        this.showGridToggle = AddToggle (titleDiv, 'ov_sidebar_subtitle_toggle');
        this.showGridToggle.OnChange (() => {
            onChange (this.showGridToggle.GetStatus ());
        });
        AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Show Grid');
        this.showGridToggle.SetStatus (showGrid);
    }

    Update (showGrid)
    {
        if (this.showGridToggle === null) {
            return;
        }
        this.showGridToggle.SetStatus (showGrid);
    }
}

export class SettingsEdgeDisplaySection
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.edgeDisplayToggle = null;
        this.pickr = null;
        this.thresholdSlider = null;
        this.thresholdSliderValue = null;
        this.edgeSettingsDiv = null;
    }

    Init (showEdges, edgeColor, edgeThreshold, callbacks)
    {
        let contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = AddDiv (contentDiv, 'ov_sidebar_subtitle');

        this.edgeDisplayToggle = AddToggle (titleDiv, 'ov_sidebar_subtitle_toggle');
        AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Show Edges');

        this.edgeSettingsDiv = AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        this.edgeDisplayToggle.OnChange (() => {
            ShowDomElement (this.edgeSettingsDiv, this.edgeDisplayToggle.GetStatus ());
            callbacks.onShowEdgesChange (this.edgeDisplayToggle.GetStatus () ? true : false);
        });

        let edgeColorRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];

        let colorInput = AddDiv (edgeColorRow, 'ov_color_picker');
        this.pickr = AddColorPicker (colorInput, edgeColor, predefinedEdgeColors, (color) => {
            callbacks.onEdgeColorChange (color);
        });
        AddDiv (edgeColorRow, null, 'Edge Color');

        let thresholdRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row large');
        this.thresholdSlider = AddRangeSlider (thresholdRow, 0, 90);
        this.thresholdSlider.setAttribute ('title', 'Edge Angle Threshold');
        this.thresholdSliderValue = AddDomElement (thresholdRow, 'span', 'ov_slider_label');
        this.thresholdSlider.addEventListener ('input', () => {
            this.thresholdSliderValue.innerHTML = this.thresholdSlider.value;
        });
        this. thresholdSlider.addEventListener ('change', () => {
            callbacks.onEdgeThresholdChange (this.thresholdSlider.value);
        });
        this.thresholdSlider.value = edgeThreshold;
        this.thresholdSliderValue.innerHTML = edgeThreshold;

        this.edgeDisplayToggle.SetStatus (showEdges);
        this.ShowEdgeSettings (showEdges);
    }

    Update (showEdges, edgeColor, edgeThreshold)
    {
        if (this.edgeDisplayToggle === null) {
            return;
        }

        this.edgeDisplayToggle.SetStatus (showEdges);
        this.ShowEdgeSettings (showEdges);

        this.pickr.setColor ('#' + ColorToHexString (edgeColor));
        this.thresholdSlider.value = edgeThreshold;
        this.thresholdSliderValue.innerHTML = edgeThreshold;
    }

    ShowEdgeSettings (show)
    {
        ShowDomElement (this.edgeSettingsDiv, show);
    }

    Clear ()
    {
        if (this.pickr === null) {
            return;
        }
        this.pickr.hide ();
    }
}

export class SettingsThemeSection
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.darkModeToggle = null;
    }

    Init (themeId, onChange)
    {
        let contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_content');
        let titleDiv = AddDiv (contentDiv, 'ov_sidebar_subtitle');

        this.darkModeToggle = AddToggle (titleDiv, 'ov_sidebar_subtitle_toggle');
        this.darkModeToggle.OnChange (() => {
            onChange (this.darkModeToggle.GetStatus () ? Theme.Dark : Theme.Light);
        });
        AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Dark Mode');

        let isDarkMode = (themeId === Theme.Dark);
        this.darkModeToggle.SetStatus (isDarkMode);
    }

    Update (themeId)
    {
        if (this.darkModeToggle === null) {
            return;
        }
        let isDarkMode = (themeId === Theme.Dark);
        this.darkModeToggle.SetStatus (isDarkMode);
    }
}

export class SidebarSettingsPanel extends SidebarPanel
{
    constructor (parentDiv, settings)
    {
        super (parentDiv);
        this.settings = settings;

        this.sectionsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_sections ov_thin_scrollbar');
        this.backgroundColorSection = new SettingsColorSection (this.sectionsDiv);
        this.defaultColorSection = new SettingsColorSection (this.sectionsDiv);
        this.gridDisplaySection = null;
        if (FeatureSet.ShowGrid) {
            this.gridDisplaySection = new SettingsGridDisplaySection (this.sectionsDiv);
        }
        this.edgeDisplaySection = new SettingsEdgeDisplaySection (this.sectionsDiv);
        this.themeSection = new SettingsThemeSection (this.sectionsDiv);

        this.resetToDefaultsButton = AddDiv (this.contentDiv, 'ov_button ov_sidebar_button outline', 'Reset to Default');
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
        if (this.gridDisplaySection !== null) {
            this.gridDisplaySection.Init (this.settings.showGrid, (showGrid) => {
                this.settings.showGrid = showGrid;
                callbacks.onGridDisplayChange ();
            });
        }
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
            if (themeId === Theme.Light) {
                this.SetBackgroundColor (new Color (255, 255, 255), true);
                this.SetDefaultColor (new Color (200, 200, 200), true);
            } else if (themeId === Theme.Dark) {
                this.SetBackgroundColor (new Color (42, 43, 46), true);
                this.SetDefaultColor (new Color (200, 200, 200), true);
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
        let defaultSettings = new Settings ();

        this.settings.backgroundColor = defaultSettings.backgroundColor;
        this.settings.defaultColor = defaultSettings.defaultColor;
        this.settings.showGrid = defaultSettings.showGrid;
        this.settings.showEdges = defaultSettings.showEdges;
        this.settings.edgeColor = defaultSettings.edgeColor;
        this.settings.edgeThreshold = defaultSettings.edgeThreshold;
        this.settings.themeId = defaultSettings.themeId;

        this.backgroundColorSection.Update (defaultSettings.backgroundColor);
        this.defaultColorSection.Update (defaultSettings.defaultColor);
        if (this.gridDisplaySection !== null) {
            this.gridDisplaySection.Update (defaultSettings.showGrid);
        }
        this.edgeDisplaySection.Update (defaultSettings.showEdges, defaultSettings.edgeColor, defaultSettings.edgeThreshold);
        this.themeSection.Update (defaultSettings.themeId);

        if (this.gridDisplaySection !== null) {
            this.callbacks.onGridDisplayChange ();
        }
        this.callbacks.onThemeChange ();
    }

    Resize ()
    {
        let titleHeight = GetDomElementOuterHeight (this.titleDiv);
        let resetButtonHeight = GetDomElementOuterHeight (this.resetToDefaultsButton);
        let height = this.parentDiv.offsetHeight;
        SetDomElementOuterHeight (this.sectionsDiv, height - titleHeight - resetButtonHeight);
    }
}
