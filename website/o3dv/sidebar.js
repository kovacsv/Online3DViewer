OV.Sidebar = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.callbacks = null;
        this.visible = true;
        this.titleDiv = null;
        this.contentDiv = null;

    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').appendTo (this.parentDiv);
        this.contentDiv = $('<div>').addClass ('ov_sidebar_content').addClass ('ov_thin_scrollbar').appendTo (this.parentDiv);
        let titleTextDiv = $('<div>').addClass ('ov_sidebar_title_text').html ('Details').appendTo (this.titleDiv);
        let titleImg = $('<img>').addClass ('ov_sidebar_title_img').attr ('src', 'assets/images/sidebar/close.svg').appendTo (this.titleDiv);
        let obj = this;
        titleImg.click (function () {
            obj.callbacks.onClose ();
        });
    }

    Show (show)
    {
        this.visible = show;
        if (this.visible) {
            this.parentDiv.show ();
        } else {
            this.parentDiv.hide ();
        }
    }

    IsVisible ()
    {
        return this.visible;
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

        let obj = this;
        let calculateButton = $('<div>').addClass ('ov_property_table_button').html ('Calculate...').appendTo (valueColumn);
        calculateButton.click (function () {
            valueColumn.empty ();
            valueColumn.html ('Please wait...');
            OV.RunTaskAsync (function () {
                let propertyValue = calculateValue ();
                if (propertyValue === null) {
                    valueColumn.html ('-');
                } else {
                    obj.DisplayPropertyValue (propertyValue, valueColumn);
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
    
    AddElementProperties (element)
    {
        this.Clear ();
        let table = $('<div>').addClass ('ov_property_table').appendTo (this.contentDiv);
        let boundingBox = OV.GetBoundingBox (element);
        let size = OV.SubCoord3D (boundingBox.max, boundingBox.min);
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Vertex Count', element.VertexCount ()));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Integer, 'Triangle Count', element.TriangleCount ()));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size X', size.x));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size Y', size.y));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Number, 'Size Z', size.z));
        this.AddCalculatedProperty (table, 'Volume', function () {
            const volume = OV.CalculateVolume (element);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, 'Surface Area', function () {
            const volume = OV.CalculateSurfaceArea (element);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        if (element.PropertyGroupCount () > 0) {
            let customTable = $('<div>').addClass ('ov_property_table ov_property_table_custom').appendTo (this.contentDiv);
            for (let i = 0; i < element.PropertyGroupCount (); i++) {
                const propertyGroup = element.GetPropertyGroup (i);
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
        this.AddProperty (table, new OV.Property (OV.PropertyType.Color, 'Color', material.diffuse));
        this.AddProperty (table, new OV.Property (OV.PropertyType.Percent, 'Opacity', material.opacity));
        AddTextureMap (this, table, 'Diffuse Map', material.diffuseMap);
        AddTextureMap (this, table, 'Specular Map', material.specularMap);
        AddTextureMap (this, table, 'Bump Map', material.bumpMap);
        AddTextureMap (this, table, 'Normal Map', material.normalMap);
        AddTextureMap (this, table, 'Emissive Map', material.emissiveMap);      
        this.Resize ();
    }    

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.contentDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        this.contentDiv.empty ();
    }
};
