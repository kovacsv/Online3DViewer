import { RunTaskAsync } from '../engine/core/taskrunner.js';
import { SubCoord3D } from '../engine/geometry/coord3d.js';
import { GetBoundingBox, IsSolid } from '../engine/model/modelutils.js';
import { CalculateVolume, CalculateSurfaceArea } from '../engine/model/quantities.js';
import { Property, PropertyType } from '../engine/model/property.js';
import { AddDiv, AddDomElement, ClearDomElement } from '../engine/viewer/domutils.js';
import { SidebarPanel } from './sidebarpanel.js';
import { CreateInlineColorCircle } from './utils.js';
import { GetFileName } from '../engine/io/fileutils.js';
import { MaterialType } from '../engine/model/material.js';
import { ColorToHexString } from '../engine/model/color.js';

export class SidebarDetailsPanel extends SidebarPanel
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
        let table = AddDiv (this.contentDiv, 'ov_property_table');
        let boundingBox = GetBoundingBox (object3D);
        let size = SubCoord3D (boundingBox.max, boundingBox.min);
        this.AddProperty (table, new Property (PropertyType.Integer, 'Vertices', object3D.VertexCount ()));
        this.AddProperty (table, new Property (PropertyType.Integer, 'Triangles', object3D.TriangleCount ()));
        this.AddProperty (table, new Property (PropertyType.Number, 'Size X', size.x));
        this.AddProperty (table, new Property (PropertyType.Number, 'Size Y', size.y));
        this.AddProperty (table, new Property (PropertyType.Number, 'Size Z', size.z));
        this.AddCalculatedProperty (table, 'Volume', () => {
            if (!IsSolid (object3D)) {
                return null;
            }
            const volume = CalculateVolume (object3D);
            if (volume === null) {
                return null;
            }
            return new Property (PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, 'Surface', () => {
            const surfaceArea = CalculateSurfaceArea (object3D);
            if (surfaceArea === null) {
                return null;
            }
            return new Property (PropertyType.Number, null, surfaceArea);
        });
        if (object3D.PropertyGroupCount () > 0) {
            let customTable = AddDiv (this.contentDiv, 'ov_property_table ov_property_table_custom');
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
            let fileName = GetFileName (map.name);
            obj.AddProperty (table, new Property (PropertyType.Text, name, fileName));
        }

        this.Clear ();
        let table = AddDiv (this.contentDiv, 'ov_property_table');
        let typeString = null;
        if (material.type === MaterialType.Phong) {
            typeString = 'Phong';
        } else if (material.type === MaterialType.Physical) {
            typeString = 'Physical';
        }
        this.AddProperty (table, new Property (PropertyType.Text, 'Source', material.isDefault ? 'Default' : 'Model'));
        this.AddProperty (table, new Property (PropertyType.Text, 'Type', typeString));
        if (material.vertexColors) {
            this.AddProperty (table, new Property (PropertyType.Text, 'Color', 'Vertex colors'));
        } else {
            this.AddProperty (table, new Property (PropertyType.Color, 'Color', material.color));
            if (material.type === MaterialType.Phong) {
                this.AddProperty (table, new Property (PropertyType.Color, 'Ambient', material.ambient));
                this.AddProperty (table, new Property (PropertyType.Color, 'Specular', material.specular));
            }
        }
        if (material.type === MaterialType.Physical) {
            this.AddProperty (table, new Property (PropertyType.Percent, 'Metalness', material.metalness));
            this.AddProperty (table, new Property (PropertyType.Percent, 'Roughness', material.roughness));
        }
        this.AddProperty (table, new Property (PropertyType.Percent, 'Opacity', material.opacity));
        AddTextureMap (this, table, 'Diffuse Map', material.diffuseMap);
        AddTextureMap (this, table, 'Bump Map', material.bumpMap);
        AddTextureMap (this, table, 'Normal Map', material.normalMap);
        AddTextureMap (this, table, 'Emissive Map', material.emissiveMap);
        if (material.type === MaterialType.Phong) {
            AddTextureMap (this, table, 'Specular Map', material.specularMap);
        } else if (material.type === MaterialType.Physical) {
            AddTextureMap (this, table, 'Metallic Map', material.metalnessMap);
        }
        this.Resize ();
    }

    AddPropertyGroup (table, propertyGroup)
    {
        let row = AddDiv (table, 'ov_property_table_row group', propertyGroup.name);
        row.setAttribute ('title', propertyGroup.name);
    }

    AddProperty (table, property)
    {
        let row = AddDiv (table, 'ov_property_table_row');
        let nameColumn = AddDiv (row, 'ov_property_table_cell ov_property_table_name', property.name + ':');
        let valueColumn = AddDiv (row, 'ov_property_table_cell ov_property_table_value');
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
        let row = AddDiv (table, 'ov_property_table_row');
        let nameColumn = AddDiv (row, 'ov_property_table_cell ov_property_table_name', name + ':');
        let valueColumn = AddDiv (row, 'ov_property_table_cell ov_property_table_value');
        nameColumn.setAttribute ('title', name);

        let calculateButton = AddDiv (valueColumn, 'ov_property_table_button', 'Calculate...');
        calculateButton.addEventListener ('click', () => {
            ClearDomElement (valueColumn);
            valueColumn.innerHTML = 'Please wait...';
            RunTaskAsync (() => {
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
        ClearDomElement (targetDiv);
        let valueText = null;
        if (property.type === PropertyType.Text) {
            valueText = property.value;
        } else if (property.type === PropertyType.Integer) {
            valueText = property.value.toLocaleString ();
        } else if (property.type === PropertyType.Number) {
            valueText = property.value.toLocaleString (undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else if (property.type === PropertyType.Boolean) {
            valueText = property.value ? 'True' : 'False';
        } else if (property.type === PropertyType.Percent) {
            valueText = parseInt (property.value * 100, 10).toString () + '%';
        } else if (property.type === PropertyType.Color) {
            let hexString = '#' + ColorToHexString (property.value);
            let colorCircle = CreateInlineColorCircle (property.value);
            targetDiv.appendChild (colorCircle);
            AddDomElement (targetDiv, 'span', null, hexString);
        }
        if (valueText !== null) {
            targetDiv.innerHTML = valueText;
            targetDiv.setAttribute ('title', valueText);
        }
    }
}
