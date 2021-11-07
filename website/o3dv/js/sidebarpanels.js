
OV.SidebarPanel = class extends OV.Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').appendTo (this.panelDiv);
        this.contentDiv = $('<div>').addClass ('ov_sidebar_content').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        $('<div>').addClass ('ov_sidebar_title_text').html (this.GetName ()).appendTo (this.titleDiv);

        let panelName = this.GetName ();
        this.titleDiv.html (panelName).attr ('title', panelName);
    }

    GetName ()
    {
        return null;
    }

    Clear ()
    {
        this.contentDiv.empty ();
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
        let table = $('<div>').addClass ('ov_property_table').appendTo (this.contentDiv);
        let boundingBox = OV.GetBoundingBox (object3D);
        let size = OV.SubCoord3D (boundingBox.max, boundingBox.min);
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Vertex Count', object3D.VertexCount ()));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Triangle Count', object3D.TriangleCount ()));
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
        this.AddCalculatedProperty (table, 'Surface Area', () => {
            const volume = OV.CalculateSurfaceArea (object3D);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        if (object3D.PropertyGroupCount () > 0) {
            let customTable = $('<div>').addClass ('ov_property_table ov_property_table_custom').appendTo (this.contentDiv);
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
        let table = $('<div>').addClass ('ov_property_table').appendTo (this.contentDiv);
        let typeString = null;
        if (material.type === OV.MaterialType.Phong) {
            typeString = 'Phong';
        } else if (material.type === OV.MaterialType.Physical) {
            typeString = 'Physical';
        }
        this.AddProperty (table, new OV.Property (OV.PropertyType.Text, 'Source', material.isDefault ? 'Default' : 'Model'));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Text, 'Type', typeString));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Color, 'Color', material.color));
        if (material.type === OV.MaterialType.Physical) {
            this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Metalness', material.metalness));
            this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Roughness', material.roughness));
        }
        this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Opacity', material.opacity));
        AddTextureMap (this, table, 'Diffuse Map', material.diffuseMap);
        AddTextureMap (this, table, 'Specular Map', material.specularMap);
        AddTextureMap (this, table, 'Bump Map', material.bumpMap);
        AddTextureMap (this, table, 'Normal Map', material.normalMap);
        AddTextureMap (this, table, 'Emissive Map', material.emissiveMap);
        AddTextureMap (this, table, 'Metallic Map', material.metalnessMap);
        this.Resize ();
    }

    AddPropertyGroup (table, propertyGroup)
    {
        let row = $('<div>').addClass ('ov_property_table_row group').appendTo (table);
        row.html (propertyGroup.name).attr ('title', propertyGroup.name);
    }

    AddProperty (table, property)
    {
        let row = $('<div>').addClass ('ov_property_table_row').appendTo (table);
        let nameColum = $('<div>').addClass ('ov_property_table_cell ov_property_table_name').appendTo (row);
        let valueColumn = $('<div>').addClass ('ov_property_table_cell ov_property_table_value').appendTo (row);
        nameColum.html (property.name + ':').attr ('title', property.name);
        this.DisplayPropertyValue (property, valueColumn);
        return row;
    }

    AddPropertyInGroup (table, property)
    {
        let row = this.AddProperty (table, property);
        row.addClass ('ingroup');
    }

    AddCalculatedProperty (table, name, calculateValue)
    {
        let row = $('<div>').addClass ('ov_property_table_row').appendTo (table);
        let nameColum = $('<div>').addClass ('ov_property_table_cell ov_property_table_name').appendTo (row);
        let valueColumn = $('<div>').addClass ('ov_property_table_cell ov_property_table_value').appendTo (row);
        nameColum.html (name + ':').attr ('title', name);

        let calculateButton = $('<div>').addClass ('ov_property_table_button').html ('Calculate...').appendTo (valueColumn);
        calculateButton.click (() => {
            valueColumn.empty ();
            valueColumn.html ('Please wait...');
            OV.RunTaskAsync (() => {
                let propertyValue = calculateValue ();
                if (propertyValue === null) {
                    valueColumn.html ('-');
                } else {
                    this.DisplayPropertyValue (propertyValue, valueColumn);
                }
            });
        });
    }

    DisplayPropertyValue (property, targetDiv)
    {
        targetDiv.empty ();
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
            colorCircle.appendTo (targetDiv);
            $('<span>').html (hexString).appendTo (targetDiv);
        }
        if (valueText !== null) {
            targetDiv.html (valueText).attr ('title', valueText);
        }
    }
};

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

    InitSettings (settings, defaultSettings, callbacks)
    {
        this.Init (callbacks);
        this.backgroundColorInput = this.AddColorParameter (
            'Background Color',
            'Background color affects only the visualization of the model.',
            null,
            ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'],
            settings.backgroundColor,
            this.callbacks.onBackgroundColorChange
        );
        this.defaultColorInput = this.AddColorParameter (
            'Default Color',
            'Default color appears when the model doesn\'t contain materials.',
            'This setting has no effect on the currently loaded file.',
            ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'],
            settings.defaultColor,
            this.callbacks.onDefaultColorChange
        );
        this.themeInput = this.AddThemeParameter (settings.themeId);
        this.AddResetToDefaultsButton (defaultSettings);
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
            OV.AddSvgIcon (warningDiv, 'warning', 'left_inline light');
            $('<div>').addClass ('ov_sidebar_settings_warning').html (warningText).appendTo (warningDiv);
        }
        return {
            pickr : pickr,
            warning : warningDiv
        };
    }

    AddThemeParameter (defaultValue)
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
        let titleDiv = $('<div>').addClass ('ov_sidebar_subtitle').appendTo (contentDiv);
        OV.AddSvgIcon (titleDiv, 'theme', 'ov_sidebar_subtitle_icon');
        $('<div>').html ('Appearance').appendTo (titleDiv);
        let buttonsDiv = $('<div>').addClass ('ov_sidebar_settings_padded').appendTo (contentDiv);
        let result = {
            buttons : [],
            select: (value) => {
                Select (result.buttons, value);
            }
        };
        result.buttons.push (AddRadioButton (buttonsDiv, OV.Theme.Light, 'Light', this.callbacks.onThemeChange));
        result.buttons.push (AddRadioButton (buttonsDiv, OV.Theme.Dark, 'Dark', this.callbacks.onThemeChange));
        Select (result.buttons, defaultValue);
        return result;

    }

    AddResetToDefaultsButton (defaultSettings)
    {
        let resetToDefaultsButton = $('<div>').addClass ('ov_button').addClass ('outline').addClass ('ov_sidebar_button').html ('Reset to Default').appendTo (this.contentDiv);
        resetToDefaultsButton.click (() => {
            this.backgroundColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.backgroundColor));
            this.callbacks.onBackgroundColorChange (defaultSettings.backgroundColor);
            this.defaultColorInput.pickr.setColor ('#' + OV.ColorToHexString (defaultSettings.defaultColor));
            this.callbacks.onDefaultColorChange (defaultSettings.defaultColor);
            if (this.themeInput !== null) {
                this.themeInput.select (defaultSettings.themeId);
                this.callbacks.onThemeChange (defaultSettings.themeId);
            }
        });
    }
};
