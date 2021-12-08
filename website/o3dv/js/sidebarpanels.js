OV.SidebarPanel = class extends OV.Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = OV.AddDiv (this.panelDiv, 'ov_sidebar_title');
        this.contentDiv = OV.AddDiv (this.panelDiv, 'ov_sidebar_content ov_thin_scrollbar');

        let panelName = this.GetName ();
        OV.AddDiv (this.titleDiv, 'ov_sidebar_title_text', this.GetName ());
        this.titleDiv.setAttribute ('title', panelName);
    }

    GetName ()
    {
        return null;
    }

    Clear ()
    {
        OV.ClearDomElement (this.contentDiv);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }
};

OV.DetailsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetName ()
    {
        return 'Details';
    }

    GetIcon ()
    {
        return 'details';
    }

    AddObject3DProperties (object3D)
    {
        this.Clear ();
        let table = OV.AddDiv (this.contentDiv, 'ov_property_table');
        let boundingBox = OV.GetBoundingBox (object3D);
        let size = OV.SubCoord3D (boundingBox.max, boundingBox.min);
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Vertices', object3D.VertexCount ()));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Triangles', object3D.TriangleCount ()));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size X', size.x));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size Y', size.y));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size Z', size.z));
        this.AddCalculatedProperty (table, 'Volume', () => {
            const volume = OV.CalculateVolume (object3D);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, 'Surface', () => {
            const volume = OV.CalculateSurfaceArea (object3D);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        if (object3D.PropertyGroupCount () > 0) {
            let customTable = OV.AddDiv (this.contentDiv, 'ov_property_table ov_property_table_custom');
            for (let i = 0; i < object3D.PropertyGroupCount (); i++) {
                const propertyGroup = object3D.GetPropertyGroup (i);
                this.AddPropertyGroup (customTable, propertyGroup);
                for (let j = 0; j < propertyGroup.PropertyCount (); j++) {
                    const property = propertyGroup.GetProperty (j);
                    this.AddPropertyInGroup (customTable, property);
                }
            }
        }
        this.Resize ();
    }

    AddMaterialProperties (material)
    {
        function AddTextureMap (obj, table, name, map)
        {
            if (map === null || map.name === null) {
                return;
            }
            let fileName = OV.GetFileName (map.name);
            obj.AddProperty (table, new OV.Property (OV.PropertyType.Text, name, fileName));
        }

        this.Clear ();
        let table = OV.AddDiv (this.contentDiv, 'ov_property_table');
        let typeString = null;
        if (material.type === OV.MaterialType.Phong) {
            typeString = 'Phong';
        } else if (material.type === OV.MaterialType.Physical) {
            typeString = 'Physical';
        }
        this.AddProperty (table, new OV.Property (OV.PropertyType.Text, 'Source', material.isDefault ? 'Default' : 'Model'));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Text, 'Type', typeString));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Color, 'Color', material.color));
        if (material.type === OV.MaterialType.Phong) {
            this.AddProperty (table, new OV.Property (OV.PropertyType.Color, 'Ambient', material.ambient));
            this.AddProperty (table, new OV.Property (OV.PropertyType.Color, 'Specular', material.specular));
        } else if (material.type === OV.MaterialType.Physical) {
            this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Metalness', material.metalness));
            this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Roughness', material.roughness));
        }
        this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Opacity', material.opacity));
        AddTextureMap (this, table, 'Diffuse Map', material.diffuseMap);
        AddTextureMap (this, table, 'Bump Map', material.bumpMap);
        AddTextureMap (this, table, 'Normal Map', material.normalMap);
        AddTextureMap (this, table, 'Emissive Map', material.emissiveMap);
        if (material.type === OV.MaterialType.Phong) {
            AddTextureMap (this, table, 'Specular Map', material.specularMap);
        } else if (material.type === OV.MaterialType.Physical) {
            AddTextureMap (this, table, 'Metallic Map', material.metalnessMap);
        }
        this.Resize ();
    }

    AddPropertyGroup (table, propertyGroup)
    {
        let row = OV.AddDiv (table, 'ov_property_table_row group', propertyGroup.name);
        row.setAttribute ('title', propertyGroup.name);
    }

    AddProperty (table, property)
    {
        let row = OV.AddDiv (table, 'ov_property_table_row');
        let nameColumn = OV.AddDiv (row, 'ov_property_table_cell ov_property_table_name', property.name + ':');
        let valueColumn = OV.AddDiv (row, 'ov_property_table_cell ov_property_table_value');
        nameColumn.setAttribute ('title', property.name);
        this.DisplayPropertyValue (property, valueColumn);
        return row;
    }

    AddPropertyInGroup (table, property)
    {
        let row = this.AddProperty (table, property);
        row.classList.add ('ingroup');
    }

    AddCalculatedProperty (table, name, calculateValue)
    {
        let row = OV.AddDiv (table, 'ov_property_table_row');
        let nameColumn = OV.AddDiv (row, 'ov_property_table_cell ov_property_table_name', name + ':');
        let valueColumn = OV.AddDiv (row, 'ov_property_table_cell ov_property_table_value');
        nameColumn.setAttribute ('title', name);

        let calculateButton = OV.AddDiv (valueColumn, 'ov_property_table_button', 'Calculate...');
        calculateButton.addEventListener ('click', () => {
            OV.ClearDomElement (valueColumn);
            valueColumn.innerHTML = 'Please wait...';
            OV.RunTaskAsync (() => {
                let propertyValue = calculateValue ();
                if (propertyValue === null) {
                    valueColumn.innerHTML = '-';
                } else {
                    this.DisplayPropertyValue (propertyValue, valueColumn);
                }
            });
        });
    }

    DisplayPropertyValue (property, targetDiv)
    {
        OV.ClearDomElement (targetDiv);
        let valueText = null;
        if (property.type === OV.PropertyType.Text) {
            valueText = property.value;
        } else if (property.type === OV.PropertyType.Integer) {
            valueText = property.value.toLocaleString ();
        } else if (property.type === OV.PropertyType.Number) {
            valueText = property.value.toLocaleString (undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else if (property.type === OV.PropertyType.Boolean) {
            valueText = property.value ? 'True' : 'False';
        } else if (property.type === OV.PropertyType.Percent) {
            valueText = parseInt (property.value * 100, 10).toString () + '%';
        } else if (property.type === OV.PropertyType.Color) {
            let hexString = '#' + OV.ColorToHexString (property.value);
            let colorCircle = OV.CreateInlineColorCircle (property.value);
            targetDiv.appendChild (colorCircle);
            OV.AddDomElement (targetDiv, 'span', null, hexString);
        }
        if (valueText !== null) {
            targetDiv.innerHTML = valueText;
            targetDiv.setAttribute ('title', valueText);
        }
    }
};

OV.SettingsSidebarPanel = class extends OV.SidebarPanel
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
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            this.settings.backgroundColor,
            (newColor) => {
                this.SetBackgroundColor (newColor, false);
            }
        );
        this.defaultColorInput = this.AddColorParameter (
            'Default Color',
            'Appears when the model doesn\'t have materials.',
            'Has no effect on the currently loaded file.',
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            this.settings.defaultColor,
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

    AddColorParameter (title, description, warningText, predefinedColors, defaultValue, onChange)
    {
        let contentDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        let colorInput = OV.AddDiv (titleDiv, 'color-picker');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle', title);
        const pickr = Pickr.create ({
            el : colorInput,
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

    AddEdgeDisplayParameter (show, edgeColor, edgeThreshold)
    {
        function AddRadioButton (contentDiv, id, text, onChange)
        {
            let row = OV.AddDiv (contentDiv, 'ov_sidebar_settings_row');
            return OV.AddRadioButton (row, 'edge_display', id, text, onChange);
        }

        let contentDiv = OV.AddDiv (this.contentDiv, 'ov_sidebar_settings_content');
        let titleDiv = OV.AddDiv (contentDiv, 'ov_sidebar_subtitle');
        OV.AddSvgIconElement (titleDiv, 'edges', 'ov_sidebar_subtitle_icon');
        OV.AddDiv (titleDiv, 'ov_sidebar_subtitle_text', 'Edge Display');

        let buttonsDiv = OV.AddDiv (contentDiv, 'ov_sidebar_settings_padded');
        let buttons = [];
        let offButton = AddRadioButton (buttonsDiv, 'off', 'Don\'t Show Edges', () => {
            this.settings.showEdges = false;
            this.callbacks.onEdgeDisplayChange ();
        });
        let onButton = AddRadioButton (buttonsDiv, 'on', 'Show Edges', () => {
            this.settings.showEdges = true;
            this.callbacks.onEdgeDisplayChange ();
        });
        buttons.push (offButton);
        buttons.push (onButton);

        OV.SelectRadioButton (buttons, show ? 'on' : 'off');
        return {
            select : (value) => {
                OV.SelectRadioButton (buttons, value ? 'on' : 'off');
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
            this.callbacks.onEdgeDisplayChange ();

            this.settings.themeId = defaultSettings.themeId;
            this.themeInput.select (this.settings.themeId);
            this.callbacks.onThemeChange ();
        });
    }
};
