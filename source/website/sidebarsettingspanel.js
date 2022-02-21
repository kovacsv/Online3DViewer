import { Color, ColorToHexString } from '../engine/model/color.js';
import { AddDiv, AddDomElement, AddRangeSlider, AddToggle, AddCheckbox, ShowDomElement, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToElementTopLeft } from './dialogs.js';
import { FeatureSet } from './featureset.js';
import { PopupDialog } from './modal.js';
import { Settings, Theme } from './settings.js';
import { SidebarPanel } from './sidebarpanel.js';
import { AddSvgIconElement } from './utils.js';

function AddColorPicker (parentDiv, defaultColor, predefinedColors, onChange)
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

class EnvironmentMapPopup extends PopupDialog
{
    constructor ()
    {
        super ();
    }

    ShowPopup (buttonDiv, settings, callbacks)
    {
        let contentDiv = super.Init (() => {
            return CalculatePopupPositionToElementTopLeft (buttonDiv, contentDiv);
        });

        let envMapImages = [
            {
                element: null,
                name: 'fishermans_bastion'
            },
            {
                element: null,
                name: 'citadella'
            },
            {
                element: null,
                name: 'maskonaive'
            },
            {
                element: null,
                name: 'teide'
            },
            {
                element: null,
                name: 'ice_river'
            },
            {
                element: null,
                name: 'park'
            }
        ];

        for (let envMapImage of envMapImages) {
            envMapImage.element = AddDomElement (contentDiv, 'img', 'ov_environment_map_preview');
            envMapImage.element.setAttribute ('src', 'assets/envmaps/' + envMapImage.name + '.jpg');
            if (envMapImage.name === settings.environmentMapName) {
                envMapImage.element.classList.add ('selected');
            }
            envMapImage.element.addEventListener ('click', () => {
                for (let otherImage of envMapImages) {
                    otherImage.element.classList.remove ('selected');
                }
                envMapImage.element.classList.add ('selected');
                settings.environmentMapName = envMapImage.name;
                callbacks.onEnvironmentMapChange ();
            });
        }

        let backgroundIsEnvMapCheckbox = AddCheckbox (contentDiv, 'use_as_background', 'Use as background', settings.backgroundIsEnvMap, () => {
            settings.backgroundIsEnvMap = backgroundIsEnvMapCheckbox.checked;
            callbacks.onEnvironmentMapChange ();
        });

        contentDiv.classList.add ('sidebar');
        this.Show ();
    }
}

class SettingsSection
{
    constructor (parentDiv, title)
    {
        this.parentDiv = parentDiv;
        this.contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_section');
        AddDiv (this.contentDiv, 'ov_sidebar_title', title);
    }

    Init (settings, callbacks)
    {

    }

    Update (settings)
    {

    }

    Clear ()
    {

    }
}

class SettingsModelDisplaySection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, 'Model Display');

        this.environmentMapButton = null;
        this.environmentMapPopup = null;

        this.backgroundColorPicker = null;

        this.edgeDisplayToggle = null;
        this.edgeColorPicker = null;
        this.thresholdSlider = null;
        this.thresholdSliderValue = null;
        this.edgeSettingsDiv = null;
    }

    Init (settings, callbacks)
    {
        if (FeatureSet.EnvironmentMap) {
            this.environmentMapButton = AddDiv (this.contentDiv, 'ov_panel_button');
            AddSvgIconElement (this.environmentMapButton, 'arrow_left', 'ov_panel_button_left_icon');
            AddDiv (this.environmentMapButton, 'ov_panel_button_text', 'Environment Map');
            this.environmentMapButton.addEventListener ('click', () => {
                this.environmentMapPopup = new EnvironmentMapPopup ();
                this.environmentMapPopup.ShowPopup (this.environmentMapButton, settings, {
                    onEnvironmentMapChange : () => {
                        callbacks.onEnvironmentMapChange ();
                    }
                });
            });
        }

        let backgroundColorDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        let backgroundColorInput = AddDiv (backgroundColorDiv, 'ov_color_picker');
        AddDiv (backgroundColorDiv, null, 'Background Color');
        let predefinedBackgroundColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];
        this.backgroundColorPicker = AddColorPicker (backgroundColorInput, settings.backgroundColor, predefinedBackgroundColors, (color) => {
            settings.backgroundColor = color;
            callbacks.onBackgroundColorChange ();
        });

        let edgeParameterDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.edgeDisplayToggle = AddToggle (edgeParameterDiv, 'ov_sidebar_parameter_toggle');
        AddDiv (edgeParameterDiv, 'ov_sidebar_parameter_text', 'Show Edges');

        this.edgeSettingsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_padded');
        this.edgeDisplayToggle.OnChange (() => {
            ShowDomElement (this.edgeSettingsDiv, this.edgeDisplayToggle.GetStatus ());
            settings.showEdges = this.edgeDisplayToggle.GetStatus ();
            callbacks.onShowEdgesChange ();
        });

        let edgeColorRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];

        let edgeColorInput = AddDiv (edgeColorRow, 'ov_color_picker');
        this.edgeColorPicker = AddColorPicker (edgeColorInput, settings.edgeColor, predefinedEdgeColors, (color) => {
            settings.edgeColor = color;
            callbacks.onEdgeColorChange ();
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
            settings.edgeThreshold = this.thresholdSlider.value;
            callbacks.onEdgeThresholdChange ();
        });
        this.thresholdSlider.value = settings.edgeThreshold;
        this.thresholdSliderValue.innerHTML = settings.edgeThreshold;

        this.edgeDisplayToggle.SetStatus (settings.showEdges);
        ShowDomElement (this.edgeSettingsDiv, settings.showEdges);
    }

    UpdateVisibility (isPhysicallyBased)
    {
        if (this.environmentMapButton !== null) {
            ShowDomElement (this.environmentMapButton, isPhysicallyBased);
        }
    }

    Update (settings)
    {
        if (this.backgroundColorPicker !== null) {
            this.backgroundColorPicker.setColor ('#' + ColorToHexString (settings.backgroundColor));
        }

        if (this.edgeDisplayToggle !== null) {
            this.edgeDisplayToggle.SetStatus (settings.showEdges);
            ShowDomElement (this.edgeSettingsDiv, settings.showEdges);

            this.edgeColorPicker.setColor ('#' + ColorToHexString (settings.edgeColor));
            this.thresholdSlider.value = settings.edgeThreshold;
            this.thresholdSliderValue.innerHTML = settings.edgeThreshold;
        }
    }

    Clear ()
    {
        if (this.environmentMapPopup !== null) {
            this.environmentMapPopup.Hide ();
            this.environmentMapPopup = null;
        }

        if (this.backgroundColorPicker !== null) {
            this.backgroundColorPicker.hide ();
        }

        if (this.edgeColorPicker !== null) {
            this.edgeColorPicker.hide ();
        }
    }
}

class SettingsImportParametersSection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, 'Import Settings');
        this.defaultColorPicker = null;
    }

    Init (settings, callbacks)
    {
        let defaultColorDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        let defaultColorInput = AddDiv (defaultColorDiv, 'ov_color_picker');
        AddDiv (defaultColorDiv, null, 'Default Color');
        let predefinedDefaultColors = ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'];
        this.defaultColorPicker = AddColorPicker (defaultColorInput, settings.defaultColor, predefinedDefaultColors, (color) => {
            settings.defaultColor = color;
            callbacks.onDefaultColorChange ();
        });
    }

    Update (settings)
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.setColor ('#' + ColorToHexString (settings.defaultColor));
        }
    }

    UpdateVisibility (hasDefaultMaterial)
    {
        if (this.contentDiv !== null) {
            ShowDomElement (this.contentDiv, hasDefaultMaterial);
        }
    }

    Clear ()
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.hide ();
        }
    }
}

class SettingsAppearanceSection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, 'Appearance');
        this.darkModeToggle = null;
    }

    Init (settings, callbacks)
    {
        let darkModeParameterDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');

        this.darkModeToggle = AddToggle (darkModeParameterDiv, 'ov_sidebar_parameter_toggle');
        this.darkModeToggle.OnChange (() => {
            settings.themeId = (this.darkModeToggle.GetStatus () ? Theme.Dark : Theme.Light);
            callbacks.onThemeChange ();
        });
        AddDiv (darkModeParameterDiv, null, 'Dark Mode');

        let isDarkMode = (settings.themeId === Theme.Dark);
        this.darkModeToggle.SetStatus (isDarkMode);
    }

    Update (settings)
    {
        if (this.darkModeToggle !== null) {
            let isDarkMode = (settings.themeId === Theme.Dark);
            this.darkModeToggle.SetStatus (isDarkMode);
        }
    }
}

export class SidebarSettingsPanel extends SidebarPanel
{
    constructor (parentDiv, settings)
    {
        super (parentDiv);
        this.settings = settings;

        this.sectionsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_sections ov_thin_scrollbar');
        this.modelDisplaySection = new SettingsModelDisplaySection (this.sectionsDiv);
        this.importParametersSection = new SettingsImportParametersSection (this.sectionsDiv);
        this.appearanceSection = new SettingsAppearanceSection (this.sectionsDiv);

        this.resetToDefaultsButton = AddDiv (this.contentDiv, 'ov_button ov_panel_button outline', 'Reset to Default');
        this.resetToDefaultsButton.addEventListener ('click', () => {
            this.ResetToDefaults ();
        });
    }

    GetName ()
    {
        return 'Settings';
    }

    HasTitle ()
    {
        return false;
    }

    GetIcon ()
    {
        return 'settings';
    }

    Clear ()
    {
        this.modelDisplaySection.Clear ();
        this.importParametersSection.Clear ();
        this.appearanceSection.Clear ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.modelDisplaySection.Init (this.settings, {
            onEnvironmentMapChange : () => {
                callbacks.onEnvironmentMapChange ();
            },
            onBackgroundColorChange : () => {
                callbacks.onBackgroundColorChange ();
            },
            onShowEdgesChange : () => {
                callbacks.onEdgeDisplayChange ();
            },
            onEdgeColorChange : () => {
                callbacks.onEdgeDisplayChange ();
            },
            onEdgeThresholdChange : () => {
                callbacks.onEdgeDisplayChange ();
            }
        });
        this.importParametersSection.Init (this.settings, {
            onDefaultColorChange : () => {
                callbacks.onDefaultColorChange ();
            }
        });
        this.appearanceSection.Init (this.settings, {
            onThemeChange : () => {
                if (this.settings.themeId === Theme.Light) {
                    this.settings.backgroundColor = new Color (255, 255, 255);
                    this.settings.defaultColor = new Color (200, 200, 200);
                } else if (this.settings.themeId === Theme.Dark) {
                    this.settings.backgroundColor = new Color (42, 43, 46);
                    this.settings.defaultColor = new Color (200, 200, 200);
                }
                this.modelDisplaySection.Update (this.settings);
                this.importParametersSection.Update (this.settings);
                callbacks.onThemeChange ();
            }
        });
    }

    UpdateSettings (isPhysicallyBased, hasDefaultMaterial)
    {
        this.modelDisplaySection.UpdateVisibility (isPhysicallyBased);
        this.importParametersSection.UpdateVisibility (hasDefaultMaterial);
        this.Resize ();
    }

    ResetToDefaults ()
    {
        let defaultSettings = new Settings ();

        this.settings.environmentMapName = defaultSettings.environmentMapName;
        this.settings.backgroundIsEnvMap = defaultSettings.backgroundIsEnvMap;
        this.settings.backgroundColor = defaultSettings.backgroundColor;
        this.settings.defaultColor = defaultSettings.defaultColor;
        this.settings.showEdges = defaultSettings.showEdges;
        this.settings.edgeColor = defaultSettings.edgeColor;
        this.settings.edgeThreshold = defaultSettings.edgeThreshold;
        this.settings.themeId = defaultSettings.themeId;

        this.modelDisplaySection.Update (this.settings);
        this.importParametersSection.Update (this.settings);
        this.appearanceSection.Update (this.settings);

        this.callbacks.onEnvironmentMapChange ();
        this.callbacks.onThemeChange ();
    }

    Resize ()
    {
        let resetButtonHeight = this.resetToDefaultsButton.offsetHeight;
        let height = this.parentDiv.offsetHeight;
        SetDomElementOuterHeight (this.sectionsDiv, height - resetButtonHeight);
    }
}
