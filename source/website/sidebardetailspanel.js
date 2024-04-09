import { RunTaskAsync } from '../engine/core/taskrunner.js';
import { SubCoord3D } from '../engine/geometry/coord3d.js';
import { GetBoundingBox, IsTwoManifold } from '../engine/model/modelutils.js';
import { CalculateVolume, CalculateSurfaceArea } from '../engine/model/quantities.js';
import { Property, PropertyToString, PropertyType } from '../engine/model/property.js';
import { AddDiv, AddDomElement, ClearDomElement } from '../engine/viewer/domutils.js';
import { SidebarPanel } from './sidebarpanel.js';
import { CreateInlineColorCircle } from './utils.js';
import { GetFileName, IsUrl } from '../engine/io/fileutils.js';
import { MaterialSource, MaterialType } from '../engine/model/material.js';
import { RGBColorToHexString } from '../engine/model/color.js';
import { Unit } from '../engine/model/unit.js';

import { t } from './i18next.js';

function UnitToString (unit)
{
    switch (unit) {
        case Unit.Millimeter:
            return t('Millimeter');
        case Unit.Centimeter:
            return t('Centimeter');
        case Unit.Meter:
            return t('Meter');
        case Unit.Inch:
            return t('Inch');
        case Unit.Foot:
            return t('Foot');
    }
    return t('Unknown');
}

export class SidebarDetailsPanel extends SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetName ()
    {
        return t('Details');
    }

    GetIcon ()
    {
        return 'details';
    }

    AddObject3DProperties (model, object3D)
    {
        this.Clear ();
        let table = AddDiv (this.contentDiv, 'ov_property_table');
        let boundingBox = GetBoundingBox (object3D);
        let size = SubCoord3D (boundingBox.max, boundingBox.min);
        let unit = model.GetUnit ();
        this.AddProperty (table, new Property (PropertyType.Integer, t('Vertices'), object3D.VertexCount ()));
        let lineSegmentCount = object3D.LineSegmentCount ();
        if (lineSegmentCount > 0) {
            this.AddProperty (table, new Property (PropertyType.Integer, t('Lines'), lineSegmentCount));
        }
        let triangleCount = object3D.TriangleCount ();
        if (triangleCount > 0) {
            this.AddProperty (table, new Property (PropertyType.Integer, t('Triangles'), triangleCount));
        }
        if (unit !== Unit.Unknown) {
            this.AddProperty (table, new Property (PropertyType.Text, t('Unit'), UnitToString (unit)));
        }
        this.AddProperty (table, new Property (PropertyType.Number, t('Size X'), size.x));
        this.AddProperty (table, new Property (PropertyType.Number, t('Size Y'), size.y));
        this.AddProperty (table, new Property (PropertyType.Number, t('Size Z'), size.z));
        this.AddCalculatedProperty (table, t('Volume'), () => {
            if (!IsTwoManifold (object3D)) {
                return null;
            }
            const volume = CalculateVolume (object3D);
            return new Property (PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, t('Surface'), () => {
            const surfaceArea = CalculateSurfaceArea (object3D);
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
        let materialSource = (material.source !== MaterialSource.Model) ? t('Default') : t('Model');
        this.AddProperty (table, new Property (PropertyType.Text, t('Source'), materialSource));
        this.AddProperty (table, new Property (PropertyType.Text, t('Type'), typeString));
        if (material.vertexColors) {
            this.AddProperty (table, new Property (PropertyType.Text, t('Color'), 'Vertex colors'));
        } else {
            this.AddProperty (table, new Property (PropertyType.Color, t('Color'), material.color));
            if (material.type === MaterialType.Phong) {
                this.AddProperty (table, new Property (PropertyType.Color, t('Ambient'), material.ambient));
                this.AddProperty (table, new Property (PropertyType.Color, t('Specular'), material.specular));
            }
        }
        if (material.type === MaterialType.Physical) {
            this.AddProperty (table, new Property (PropertyType.Percent, t('Metalness'), material.metalness));
            this.AddProperty (table, new Property (PropertyType.Percent, t('Roughness'), material.roughness));
        }
        this.AddProperty (table, new Property (PropertyType.Percent, t('Opacity'), material.opacity));
        AddTextureMap (this, table, t('Diffuse Map'), material.diffuseMap);
        AddTextureMap (this, table, t('Bump Map'), material.bumpMap);
        AddTextureMap (this, table, t('Normal Map'), material.normalMap);
        AddTextureMap (this, table, t('Emissive Map'), material.emissiveMap);
        if (material.type === MaterialType.Phong) {
            AddTextureMap (this, table, t('Specular Map'), material.specularMap);
        } else if (material.type === MaterialType.Physical) {
            AddTextureMap (this, table, t('Metallic Map'), material.metalnessMap);
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

        let calculateButton = AddDiv (valueColumn, 'ov_property_table_button', t('Calculate') + '...');
        calculateButton.addEventListener ('click', () => {
            ClearDomElement (valueColumn);
            valueColumn.innerHTML = t('Please wait...');
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
        let valueHtml = null;
        let valueTitle = null;
        if (property.type === PropertyType.Text) {
            if (IsUrl (property.value)) {
                valueHtml = '<a target="_blank" href="' + property.value + '">' + property.value + '</a>';
                valueTitle = property.value;
            } else {
                valueHtml = PropertyToString (property);
            }
        } else if (property.type === PropertyType.Color) {
            let hexString = '#' + RGBColorToHexString (property.value);
            let colorCircle = CreateInlineColorCircle (property.value);
            targetDiv.appendChild (colorCircle);
            AddDomElement (targetDiv, 'span', null, hexString);
        } else {
            valueHtml = PropertyToString (property);
        }
        if (valueHtml !== null) {
            targetDiv.innerHTML = valueHtml;
            targetDiv.setAttribute ('title', valueTitle !== null ? valueTitle : valueHtml);
        }
    }
}
