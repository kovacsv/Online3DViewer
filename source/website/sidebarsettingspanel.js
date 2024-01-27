import { RGBColor, RGBColorToHexString, RGBAColor, RGBAColorToHexString, ColorComponentFromFloat } from '../engine/model/color.js';
import { AddDiv, AddDomElement, ShowDomElement, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { AddRangeSlider, AddToggle, AddCheckbox } from '../website/utils.js';
import { CalculatePopupPositionToElementTopLeft } from './dialogs.js';
import { PopupDialog } from './dialog.js';
import { Settings } from './settings.js';
import { SidebarPanel } from './sidebarpanel.js';
import { ShadingType } from '../engine/threejs/threeutils.js';
import { ProjectionMode } from '../engine/viewer/camera.js';
import { Loc } from '../engine/core/localization.js';

import * as Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/monolith.min.css';
import { MaterialSource } from '../engine/main.js';

function AddColorPicker (parentDiv, opacity, defaultColor, predefinedColors, onChange)
{
    let pickr = Pickr.create ({
        el : parentDiv,
        theme : 'monolith',
        position : 'left-start',
        swatches : predefinedColors,
        comparison : false,
        default : defaultColor,
        components : {
            preview : false,
            opacity : opacity,
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
        onChange (
            parseInt (rgbaColor[0], 10),
            parseInt (rgbaColor[1], 10),
            parseInt (rgbaColor[2], 10),
            ColorComponentFromFloat (rgbaColor[3])
        );
    });
    return pickr;
}

class EnvironmentMapPopup extends PopupDialog
{
    constructor ()
    {
        super ();
    }

    ShowPopup (buttonDiv, shadingType, settings, callbacks)
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

        if (shadingType === ShadingType.Phong) {
            envMapImages.unshift ({
                element : null,
                name : 'noimage'
            });
            for (let envMapImage of envMapImages) {
                envMapImage.element = AddDomElement (contentDiv, 'img', 'ov_environment_map_preview');
                envMapImage.element.setAttribute ('src', 'assets/envmaps/' + envMapImage.name + '.jpg');
                let isSelected = false;
                if (settings.backgroundIsEnvMap) {
                    isSelected = (envMapImage.name === settings.environmentMapName);
                } else {
                    isSelected = (envMapImage.name === 'noimage');
                }
                if (isSelected) {
                    envMapImage.element.classList.add ('selected');
                }
                envMapImage.element.addEventListener ('click', () => {
                    for (let otherImage of envMapImages) {
                        otherImage.element.classList.remove ('selected');
                    }
                    envMapImage.element.classList.add ('selected');
                    if (envMapImage.name === 'noimage') {
                        settings.backgroundIsEnvMap = false;
                        settings.environmentMapName = 'fishermans_bastion';
                    } else {
                        settings.backgroundIsEnvMap = true;
                        settings.environmentMapName = envMapImage.name;
                    }
                    callbacks.onEnvironmentMapChanged ();
                });
            }
        } else if (shadingType === ShadingType.Physical) {
            let isPerspective = (callbacks.getProjectionMode () === ProjectionMode.Perspective);
            if (isPerspective) {
                let checkboxDiv = AddDiv (contentDiv, 'ov_environment_map_checkbox');
                let backgroundIsEnvMapCheckbox = AddCheckbox (checkboxDiv, 'use_as_background', 'Use as background image', settings.backgroundIsEnvMap, () => {
                    settings.backgroundIsEnvMap = backgroundIsEnvMapCheckbox.checked;
                    callbacks.onEnvironmentMapChanged ();
                });
            }

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
                    callbacks.onEnvironmentMapChanged ();
                });
            }
        }

        contentDiv.classList.add ('sidebar');
        this.Open ();
    }

    Update ()
    {

    }
}

class SettingsSection
{
    constructor (parentDiv, title, settings)
    {
        this.parentDiv = parentDiv;
        this.contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_section');
        AddDiv (this.contentDiv, 'ov_sidebar_title', title);
        this.settings = settings;
        this.callbacks = null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    Update ()
    {

    }

    UpdateVisibility ()
    {

    }

    Clear ()
    {

    }
}

class SettingsModelDisplaySection extends SettingsSection
{
    constructor (parentDiv, settings)
    {
        super (parentDiv, Loc ('Model Display'), settings);

        this.backgroundColorPicker = null;

        this.environmentMapPhongDiv = null;
        this.environmentMapPhongInput = null;

        this.environmentMapPbrDiv = null;
        this.environmentMapPbrInput = null;

        this.environmentMapPopup = null;

        this.edgeDisplayToggle = null;
        this.edgeColorPicker = null;
        this.thresholdSlider = null;
        this.thresholdSliderValue = null;
        this.edgeSettingsDiv = null;
    }

    Init (callbacks)
    {
        super.Init (callbacks);

        let backgroundColorDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        let backgroundColorInput = AddDiv (backgroundColorDiv, 'ov_color_picker');
        AddDiv (backgroundColorDiv, null, Loc ('Background Color'));
        let predefinedBackgroundColors = ['#ffffffff', '#e3e3e3ff', '#c9c9c9ff', '#898989ff', '#5f5f5fff', '#494949ff', '#383838ff', '#0f0f0fff'];
        let defaultBackgroundColor = '#' + RGBAColorToHexString (this.settings.backgroundColor);
        this.backgroundColorPicker = AddColorPicker (backgroundColorInput, true, defaultBackgroundColor, predefinedBackgroundColors, (r, g, b, a) => {
            this.settings.backgroundColor = new RGBAColor (r, g, b, a);
            this.callbacks.onBackgroundColorChanged ();
        });

        this.environmentMapPhongDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.environmentMapPhongInput = AddDiv (this.environmentMapPhongDiv, 'ov_sidebar_image_picker');
        AddDiv (this.environmentMapPhongDiv, null, Loc ('Background Image'));
        this.environmentMapPhongInput.addEventListener ('click', () => {
            this.environmentMapPopup = new EnvironmentMapPopup ();
            this.environmentMapPopup.ShowPopup (this.environmentMapPhongInput, ShadingType.Phong, this.settings, {
                getProjectionMode : () => {
                    return this.callbacks.getProjectionMode ();
                },
                onEnvironmentMapChanged : () => {
                    this.UpdateEnvironmentMap ();
                    this.callbacks.onEnvironmentMapChanged ();
                }
            });
        });

        this.environmentMapPbrDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.environmentMapPbrInput = AddDiv (this.environmentMapPbrDiv, 'ov_sidebar_image_picker');
        AddDiv (this.environmentMapPbrDiv, null, Loc ('Environment'));
        this.environmentMapPbrInput.addEventListener ('click', () => {
            this.environmentMapPopup = new EnvironmentMapPopup ();
            this.environmentMapPopup.ShowPopup (this.environmentMapPbrInput, ShadingType.Physical, this.settings, {
                getProjectionMode : () => {
                    return this.callbacks.getProjectionMode ();
                },
                onEnvironmentMapChanged : () => {
                    this.UpdateEnvironmentMap ();
                    this.callbacks.onEnvironmentMapChanged ();
                }
            });
        });

        this.UpdateEnvironmentMap ();

        let edgeParameterDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.edgeDisplayToggle = AddToggle (edgeParameterDiv, 'ov_sidebar_parameter_toggle');
        AddDiv (edgeParameterDiv, 'ov_sidebar_parameter_text', Loc ('Show Edges'));

        this.edgeSettingsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_padded');
        this.edgeDisplayToggle.OnChange (() => {
            ShowDomElement (this.edgeSettingsDiv, this.edgeDisplayToggle.GetStatus ());
            this.settings.edgeSettings.showEdges = this.edgeDisplayToggle.GetStatus ();
            this.callbacks.onShowEdgesChange ();
        });

        let edgeColorRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];

        let edgeColorInput = AddDiv (edgeColorRow, 'ov_color_picker');
        let defaultEdgeColor = '#' + RGBColorToHexString (this.settings.edgeSettings.edgeColor);
        this.edgeColorPicker = AddColorPicker (edgeColorInput, false, defaultEdgeColor, predefinedEdgeColors, (r, g, b, a) => {
            this.settings.edgeSettings.edgeColor = new RGBColor (r, g, b);
            this.callbacks.onEdgeColorChange ();
        });
        AddDiv (edgeColorRow, null, Loc ('Edge Color'));

        let thresholdRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row large');
        this.thresholdSlider = AddRangeSlider (thresholdRow, 0, 90);
        this.thresholdSlider.setAttribute ('title', Loc ('Edge Angle Threshold'));
        this.thresholdSliderValue = AddDomElement (thresholdRow, 'span', 'ov_slider_label');
        this.thresholdSlider.addEventListener ('input', () => {
            this.thresholdSliderValue.innerHTML = this.thresholdSlider.value;
        });
        this. thresholdSlider.addEventListener ('change', () => {
            this.settings.edgeSettings.edgeThreshold = this.thresholdSlider.value;
            this.callbacks.onEdgeThresholdChange ();
        });
        this.thresholdSlider.value = this.settings.edgeSettings.edgeThreshold;
        this.thresholdSliderValue.innerHTML = this.settings.edgeSettings.edgeThreshold;

        this.edgeDisplayToggle.SetStatus (this.settings.edgeSettings.showEdges);
        ShowDomElement (this.edgeSettingsDiv, this.settings.edgeSettings.showEdges);
    }

    UpdateEnvironmentMap ()
    {
        function UpdateImage (input, image)
        {
            input.style.backgroundImage = 'url(\'assets/envmaps/' + image + '.jpg\')';
        }

        if (this.environmentMapPhongDiv !== null) {
            if (this.settings.backgroundIsEnvMap) {
                UpdateImage (this.environmentMapPhongInput, this.settings.environmentMapName);
                this.environmentMapPhongInput.classList.remove ('ov_environment_map_preview_no_color');
            } else {
                this.environmentMapPhongInput.style.backgroundImage = null;
                this.environmentMapPhongInput.classList.add ('ov_environment_map_preview_no_color');
            }
        }
        if (this.environmentMapPbrDiv !== null) {
            UpdateImage (this.environmentMapPbrInput, this.settings.environmentMapName);
        }
    }

    Update ()
    {
        if (this.backgroundColorPicker !== null) {
            this.backgroundColorPicker.setColor ('#' + RGBAColorToHexString (this.settings.backgroundColor));
        }

        if (this.environmentMapPbrInput !== null || this.environmentMapPhongDiv !== null) {
            this.UpdateEnvironmentMap ();
        }

        if (this.edgeDisplayToggle !== null) {
            this.edgeDisplayToggle.SetStatus (this.settings.edgeSettings.showEdges);
            ShowDomElement (this.edgeSettingsDiv, this.settings.edgeSettings.showEdges);

            this.edgeColorPicker.setColor ('#' + RGBColorToHexString (this.settings.edgeSettings.edgeColor));
            this.thresholdSlider.value = this.settings.edgeSettings.edgeThreshold;
            this.thresholdSliderValue.innerHTML = this.settings.edgeSettings.edgeThreshold;
        }
    }

    UpdateVisibility ()
    {
        let isPhysicallyBased = (this.callbacks.getShadingType () === ShadingType.Physical);
        if (this.environmentMapPhongDiv !== null) {
            let isPerspective = (this.callbacks.getProjectionMode () === ProjectionMode.Perspective);
            ShowDomElement (this.environmentMapPhongDiv, !isPhysicallyBased && isPerspective);
        }
        if (this.environmentMapPbrDiv !== null) {
           ShowDomElement (this.environmentMapPbrDiv, isPhysicallyBased);
        }
    }

    Clear ()
    {
        if (this.environmentMapPopup !== null) {
            this.environmentMapPopup.Close ();
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
    constructor (parentDiv, settings)
    {
        super (parentDiv, Loc ('Import Settings'), settings);
        this.defaultColorPickerDiv = null;
        this.defaultLineColorPickerDiv = null;
        this.defaultColorPicker = null;
        this.defaultLineColorPicker = null;
    }

    Init (callbacks)
    {
        function AddDefaultColorPicker (contentDiv, name, defaultColor, onChange)
        {
            let colorDiv = AddDiv (contentDiv, 'ov_sidebar_parameter');
            let colorInput = AddDiv (colorDiv, 'ov_color_picker');
            AddDiv (colorDiv, null, name);
            let predefinedDefaultColors = ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'];
            let defaultColorStr = '#' + RGBColorToHexString (defaultColor);
            return AddColorPicker (colorInput, false, defaultColorStr, predefinedDefaultColors, onChange);
        }

        super.Init (callbacks);
        this.defaultColorPickerDiv = AddDiv (this.contentDiv);
        this.defaultColorPicker = AddDefaultColorPicker (this.defaultColorPickerDiv, Loc ('Default Color'), this.settings.defaultColor, (r, g, b, a) => {
            this.settings.defaultColor = new RGBColor (r, g, b);
            this.callbacks.onDefaultColorChanged ();
        });
        this.defaultLineColorPickerDiv = AddDiv (this.contentDiv);
        this.defaultLineColorPicker = AddDefaultColorPicker (this.defaultLineColorPickerDiv, Loc ('Default Line Color'), this.settings.defaultLineColor, (r, g, b, a) => {
            this.settings.defaultLineColor = new RGBColor (r, g, b);
            this.callbacks.onDefaultColorChanged ();
        });
    }

    Update ()
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.setColor ('#' + RGBColorToHexString (this.settings.defaultColor));
        }
        if (this.defaultLineColorPicker !== null) {
            this.defaultLineColorPicker.setColor ('#' + RGBColorToHexString (this.settings.defaultLineColor));
        }
    }

    UpdateVisibility ()
    {
        if (this.contentDiv !== null) {
            let defaultMaterials = this.callbacks.getDefaultMaterials ();
            if (defaultMaterials.length === 0) {
                ShowDomElement (this.contentDiv, false);
            } else {
                let sources = new Set ();
                for (let material of defaultMaterials) {
                    sources.add (material.source);
                }
                ShowDomElement (this.contentDiv, true);
                ShowDomElement (this.defaultColorPickerDiv, sources.has (MaterialSource.DefaultFace));
                ShowDomElement (this.defaultLineColorPickerDiv, sources.has (MaterialSource.DefaultLine));
            }
        }
    }

    Clear ()
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.hide ();
        }
        if (this.defaultLineColorPicker !== null) {
            this.defaultLineColorPicker.hide ();
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
        this.modelDisplaySection = new SettingsModelDisplaySection (this.sectionsDiv, this.settings);
        this.importParametersSection = new SettingsImportParametersSection (this.sectionsDiv, this.settings);

        this.resetToDefaultsButton = AddDiv (this.contentDiv, 'ov_button ov_panel_button outline', 'Reset to Default');
        this.resetToDefaultsButton.addEventListener ('click', () => {
            this.ResetToDefaults ();
        });
    }

    GetName ()
    {
        return Loc ('Settings');
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
    }

    Init (callbacks)
    {
        super.Init (callbacks);

        this.modelDisplaySection.Init ({
            getShadingType : () => {
                return this.callbacks.getShadingType ();
            },
            getProjectionMode : () => {
                return this.callbacks.getProjectionMode ();
            },
            onEnvironmentMapChanged : () => {
                this.callbacks.onEnvironmentMapChanged ();
            },
            onBackgroundColorChanged : () => {
                this.callbacks.onBackgroundColorChanged ();
            },
            onShowEdgesChange : () => {
                this.callbacks.onEdgeDisplayChanged ();
            },
            onEdgeColorChange : () => {
                this.callbacks.onEdgeDisplayChanged ();
            },
            onEdgeThresholdChange : () => {
                this.callbacks.onEdgeDisplayChanged ();
            }
        });
        this.importParametersSection.Init ({
            getDefaultMaterials : () => {
                return this.callbacks.getDefaultMaterials ();
            },
            onDefaultColorChanged : () => {
                this.callbacks.onDefaultColorChanged ();
            }
        });
    }

    UpdateControlsStatus ()
    {
        this.modelDisplaySection.Update ();
        this.importParametersSection.Update ();
    }

    UpdateControlsVisibility ()
    {
        this.modelDisplaySection.UpdateVisibility ();
        this.importParametersSection.UpdateVisibility ();
        this.Resize ();
    }

    ResetToDefaults ()
    {
        let defaultSettings = new Settings (this.settings.themeId);

        this.settings.environmentMapName = defaultSettings.environmentMapName;
        this.settings.backgroundIsEnvMap = defaultSettings.backgroundIsEnvMap;
        this.settings.backgroundColor = defaultSettings.backgroundColor;
        this.settings.defaultLineColor = defaultSettings.defaultLineColor;
        this.settings.defaultColor = defaultSettings.defaultColor;
        this.settings.edgeSettings = defaultSettings.edgeSettings;
        this.settings.themeId = defaultSettings.themeId;
        this.UpdateControlsStatus ();
        this.callbacks.onEnvironmentMapChanged ();
    }

    Resize ()
    {
        let resetButtonHeight = this.resetToDefaultsButton.offsetHeight;
        let height = this.parentDiv.offsetHeight;
        SetDomElementOuterHeight (this.sectionsDiv, height - resetButtonHeight);
    }
}
