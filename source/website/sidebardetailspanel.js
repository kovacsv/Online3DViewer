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
import { Loc } from '../engine/core/localization.js';

function UnitToString (unit)
{
    switch (unit) {
        case Unit.Millimeter:
            return Loc ('Millimeter');
        case Unit.Centimeter:
            return Loc ('Centimeter');
        case Unit.Meter:
            return Loc ('Meter');
        case Unit.Inch:
            return Loc ('Inch');
        case Unit.Foot:
            return Loc ('Foot');
    }
    return Loc ('Unknown');
}

export class SidebarDetailsPanel extends SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.sizeFormatMode = 'default';
    }

    GetName ()
    {
        return Loc ('Details');
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
        this.AddProperty (table, new Property (PropertyType.Integer, Loc ('Vertices'), object3D.VertexCount ()));
        let lineSegmentCount = object3D.LineSegmentCount ();
        if (lineSegmentCount > 0) {
            this.AddProperty (table, new Property (PropertyType.Integer, Loc ('Lines'), lineSegmentCount));
        }
        let triangleCount = object3D.TriangleCount ();
        if (triangleCount > 0) {
            this.AddProperty (table, new Property (PropertyType.Integer, Loc ('Triangles'), triangleCount));
        }
        if (unit !== Unit.Unknown) {
            this.AddProperty (table, new Property (PropertyType.Text, Loc ('Unit'), UnitToString (unit)));
        }
        
        let formatRow = AddDiv (table, 'ov_property_table_row');
        let formatNameColumn = AddDiv (formatRow, 'ov_property_table_cell ov_property_table_name', Loc ('Size Format') + ':');
        let formatValueColumn = AddDiv (formatRow, 'ov_property_table_cell ov_property_table_value');
        let selectElement = document.createElement ('select');
        selectElement.style.width = '100%';
        let defaultOption = document.createElement ('option'); defaultOption.value = 'default'; defaultOption.innerHTML = Loc ('Default'); selectElement.appendChild (defaultOption);
        let feetInchOption = document.createElement ('option'); feetInchOption.value = 'feet_inches'; feetInchOption.innerHTML = Loc ('Feet & Inches'); selectElement.appendChild (feetInchOption);
        let decFeetOption = document.createElement ('option'); decFeetOption.value = 'decimal_feet'; decFeetOption.innerHTML = Loc ('Decimal Feet'); selectElement.appendChild (decFeetOption);
        selectElement.value = this.sizeFormatMode;
        formatValueColumn.appendChild (selectElement);

        let sizeXRow = this.AddProperty (table, new Property (PropertyType.Number, Loc ('Size X'), size.x));
        let sizeYRow = this.AddProperty (table, new Property (PropertyType.Number, Loc ('Size Y'), size.y));
        let sizeZRow = this.AddProperty (table, new Property (PropertyType.Number, Loc ('Size Z'), size.z));

        let updateSizes = () => {
            let format = selectElement.value;
            this.sizeFormatMode = format;
            let formatSize = (val) => {
                if (format === 'default') {
                    return val.toLocaleString (undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                
                let inches = val;
                if (unit === Unit.Millimeter) inches = val / 25.4;
                else if (unit === Unit.Centimeter) inches = val / 2.54;
                else if (unit === Unit.Meter) inches = val * 39.3700787;
                else if (unit === Unit.Foot) inches = val * 12.0;
                else if (unit === Unit.Inch) inches = val;
                else inches = val * 39.3700787; // User requested default is meters
                
                if (format === 'feet_inches') {
                    if (inches < 12.0) {
                        return inches.toLocaleString (undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' in';
                    } else {
                        let feet = Math.floor (inches / 12.0);
                        let remInches = inches - (feet * 12.0);
                        return feet + ' ft ' + remInches.toLocaleString (undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' in';
                    }
                } else if (format === 'decimal_feet') {
                    return (inches / 12.0).toLocaleString (undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ft';
                }
            };
            
            sizeXRow.lastChild.innerHTML = formatSize (size.x);
            sizeYRow.lastChild.innerHTML = formatSize (size.y);
            sizeZRow.lastChild.innerHTML = formatSize (size.z);
        };
        selectElement.addEventListener ('change', updateSizes);
        if (this.sizeFormatMode !== 'default') {
            updateSizes ();
        }
        this.AddCalculatedProperty (table, Loc ('Volume'), () => {
            if (!IsTwoManifold (object3D)) {
                return null;
            }
            const volume = CalculateVolume (object3D);
            return new Property (PropertyType.Number, null, volume);
        });
        this.AddCalculatedProperty (table, Loc ('Surface'), () => {
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
            typeString = Loc ('Phong');
        } else if (material.type === MaterialType.Physical) {
            typeString = Loc ('Physical');
        }
        let materialSource = (material.source !== MaterialSource.Model) ? Loc ('Default') : Loc ('Model');
        this.AddProperty (table, new Property (PropertyType.Text, Loc ('Source'), materialSource));
        this.AddProperty (table, new Property (PropertyType.Text, Loc ('Type'), typeString));
        if (material.vertexColors) {
            this.AddProperty (table, new Property (PropertyType.Text, Loc ('Color'), Loc ('Vertex colors')));
        } else {
            this.AddProperty (table, new Property (PropertyType.Color, Loc ('Color'), material.color));
            if (material.type === MaterialType.Phong) {
                this.AddProperty (table, new Property (PropertyType.Color, Loc ('Ambient'), material.ambient));
                this.AddProperty (table, new Property (PropertyType.Color, Loc ('Specular'), material.specular));
            }
        }
        if (material.type === MaterialType.Physical) {
            this.AddProperty (table, new Property (PropertyType.Percent, Loc ('Metalness'), material.metalness));
            this.AddProperty (table, new Property (PropertyType.Percent, Loc ('Roughness'), material.roughness));
        }
        this.AddProperty (table, new Property (PropertyType.Percent, Loc ('Opacity'), material.opacity));
        AddTextureMap (this, table, Loc ('Diffuse Map'), material.diffuseMap);
        AddTextureMap (this, table, Loc ('Bump Map'), material.bumpMap);
        AddTextureMap (this, table, Loc ('Normal Map'), material.normalMap);
        AddTextureMap (this, table, Loc ('Emissive Map'), material.emissiveMap);
        if (material.type === MaterialType.Phong) {
            AddTextureMap (this, table, Loc ('Specular Map'), material.specularMap);
        } else if (material.type === MaterialType.Physical) {
            AddTextureMap (this, table, Loc ('Metallic Map'), material.metalnessMap);
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

        let calculateButton = AddDiv (valueColumn, 'ov_property_table_button', Loc ('Calculate...'));
        calculateButton.addEventListener ('click', () => {
            ClearDomElement (valueColumn);
            valueColumn.innerHTML = Loc ('Please wait...');
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
