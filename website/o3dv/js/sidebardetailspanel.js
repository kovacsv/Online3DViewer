OV.SidebarDetailsPanel = class extends OV.SidebarPanel
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
            if (!OV.IsSolid (object3D)) {
                return null;
            }
            const volume = OV.CalculateVolume (object3D);
            if (volume === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, 'Surface', () => {
            const surfaceArea = OV.CalculateSurfaceArea (object3D);
            if (surfaceArea === null) {
                return null;
            }
            return new OV.Property (OV.PropertyType.Number, null, surfaceArea);
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
        }
        this.AddProperty (table, new OV.Property (OV.PropertyType.Boolean, 'Vertex Colors', material.vertexColors));
        if (material.type === OV.MaterialType.Physical) {
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
