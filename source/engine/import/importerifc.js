import { Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';
import { LoadExternalLibrary } from '../io/externallibs.js';
import { ColorFromFloatComponents, IntegerToHexString } from '../model/color.js';
import { PhongMaterial } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { UpdateMaterialTransparency } from './importerutils.js';

export class ImporterIfc extends ImporterBase
{
    constructor ()
    {
        super ();
        this.ifc = null;
    }

    CanImportExtension (extension)
    {
        return extension === 'ifc';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

	ClearContent ()
	{
        this.materialNameToIndex = null;
        this.expressIDToMesh = null;
	}

    ResetContent ()
    {
        this.materialNameToIndex = new Map ();
        this.expressIDToMesh = new Map ();
    }

    ImportContent (fileContent, onFinish)
    {
		if (this.ifc === null) {
			LoadExternalLibrary ('loaders/web-ifc-api-browser.js').then (() => {
                this.ifc = new WebIFC.IfcAPI ();
                this.ifc.Init ().then (() => {
                    this.ImportIfcContent (fileContent);
                    onFinish ();
                });
            }).catch (() => {
                onFinish ();
            });
		} else {
			this.ImportIfcContent (fileContent);
			onFinish ();
		}
    }

	ImportIfcContent (fileContent)
	{
        const fileBuffer = new Uint8Array (fileContent);
		const modelID = this.ifc.OpenModel (fileBuffer, {
            COORDINATE_TO_ORIGIN : true
        });
        const ifcMeshes = this.ifc.LoadAllGeometry (modelID);
        for (let meshIndex = 0; meshIndex < ifcMeshes.size (); meshIndex++) {
            const ifcMesh = ifcMeshes.get (meshIndex);
            if (ifcMesh.geometries.size () > 0) {
                this.ImportIfcMesh (modelID, ifcMesh);
            }
        }
        this.ImportProperties (modelID);
        this.ifc.CloseModel (modelID);
	}

    ImportIfcMesh (modelID, ifcMesh)
    {
        let mesh = new Mesh ();
        mesh.SetName ('Mesh ' + ifcMesh.expressID.toString ());

        let vertexOffset = 0;
        const ifcGeometries = ifcMesh.geometries;
        for (let geometryIndex = 0; geometryIndex < ifcGeometries.size (); geometryIndex++) {
            const ifcGeometry = ifcGeometries.get (geometryIndex);
            const ifcGeometryData = this.ifc.GetGeometry (modelID, ifcGeometry.geometryExpressID);
            const ifcVertices = this.ifc.GetVertexArray (ifcGeometryData.GetVertexData (), ifcGeometryData.GetVertexDataSize ());
            const ifcIndices = this.ifc.GetIndexArray (ifcGeometryData.GetIndexData (), ifcGeometryData.GetIndexDataSize ());
            const materialIndex = this.GetMaterialIndexByColor (ifcGeometry.color);
            const matrix = new Matrix (ifcGeometry.flatTransformation);
            const transformation = new Transformation (matrix);

            for (let i = 0; i < ifcVertices.length; i += 6) {
                const x = ifcVertices[i];
                const y = ifcVertices[i + 1];
                const z = ifcVertices[i + 2];
                const coord = new Coord3D (x, y, z);
                const transformed = transformation.TransformCoord3D (coord);
                mesh.AddVertex (transformed);
            }
            // TODO: normals
            for (let i = 0; i < ifcIndices.length; i += 3) {
                const v0 = ifcIndices[i];
                const v1 = ifcIndices[i + 1];
                const v2 = ifcIndices[i + 2];
                const triangle = new Triangle (
                    vertexOffset + v0,
                    vertexOffset + v1,
                    vertexOffset + v2
                );
                triangle.SetMaterial (materialIndex);
                mesh.AddTriangle (triangle);
            }
            vertexOffset += ifcVertices.length / 6;
        }

        this.expressIDToMesh.set (ifcMesh.expressID, mesh);
        this.model.AddMeshToRootNode (mesh);
    }

    ImportProperties (modelID)
    {
        const lines = this.ifc.GetLineIDsWithType (modelID, WebIFC.IFCRELDEFINESBYPROPERTIES);
        for (let i = 0; i < lines.size (); i++) {
            const relID = lines.get (i);
            const rel = this.ifc.GetLine (modelID, relID);
            if (Array.isArray (rel.RelatingPropertyDefinition)) {
                continue;
            }
            rel.RelatedObjects.forEach ((objectRelID) => {
                let element = null;
                if (this.expressIDToMesh.has (objectRelID.value)) {
                    element = this.expressIDToMesh.get (objectRelID.value);
                } else {
                    let propSetOwner = this.ifc.GetLine (modelID, objectRelID.value, true);
                    if (propSetOwner.type === WebIFC.IFCBUILDING) {
                        element = this.model;
                    }
                }
                if (element === null) {
                    return;
                }
                let propSetDef = rel.RelatingPropertyDefinition;
                let propSet = this.ifc.GetLine (modelID, propSetDef.value, true);
                if (!propSet || !propSet.HasProperties) {
                    return;
                }
                let propertyGroup = new PropertyGroup (propSet.Name.value);
                propSet.HasProperties.forEach ((property) => {
                    if (!property || !property.Name || !property.NominalValue) {
                        return;
                    }
                    let elemProperty = null;
                    let propertyName = this.GetIFCString (property.Name.value);
                    let strValue = null;
                    switch (property.NominalValue.label) {
                        case 'IFCTEXT':
                        case 'IFCLABEL':
                        case 'IFCIDENTIFIER':
                            elemProperty = new Property (PropertyType.Text, propertyName, this.GetIFCString (property.NominalValue.value));
                            break;
                        case 'IFCBOOLEAN':
                        case 'IFCLOGICAL':
                            strValue = 'Unknown';
                            if (property.NominalValue.value === 'T') {
                                strValue = 'True';
                            } else if (property.NominalValue.value === 'F') {
                                strValue = 'False';
                            }
                            elemProperty = new Property (PropertyType.Text, propertyName, strValue);
                            break;
                        case 'IFCINTEGER':
                        case 'IFCCOUNTMEASURE':
                            elemProperty = new Property (PropertyType.Integer, propertyName, property.NominalValue.value);
                            break;
                        case 'IFCREAL':
                        case 'IFCLENGTHMEASURE':
                        case 'IFCPOSITIVELENGTHMEASURE':
                        case 'IFCAREAMEASURE':
                        case 'IFCVOLUMEMEASURE':
                        case 'IFCRATIOMEASURE':
                        case 'IFCPOSITIVERATIOMEASURE':
                        case 'IFCMASSMEASURE':
                        case 'IFCMASSPERLENGTHMEASURE':
                        case 'IFCPLANEANGLEMEASURE':
                        case 'IFCTHERMALTRANSMITTANCEMEASURE':
                            elemProperty = new Property (PropertyType.Number, propertyName, property.NominalValue.value);
                            break;
                        default:
                            // TODO
                            console.log (property.NominalValue.label);
                            console.log (property.NominalValue.value);
                            break;
                    }
                    if (elemProperty !== null) {
                        propertyGroup.AddProperty (elemProperty);
                    }
                });
                if (propertyGroup.PropertyCount () > 0) {
                    element.AddPropertyGroup (propertyGroup);
                }
            });
        }
    }

    GetMaterialIndexByColor (ifcColor)
    {
        const color = ColorFromFloatComponents (ifcColor.x, ifcColor.y, ifcColor.z);

        const materialName = 'Color ' +
            IntegerToHexString (color.r) +
            IntegerToHexString (color.g) +
            IntegerToHexString (color.b) +
            IntegerToHexString (parseInt (ifcColor.w * 255.0, 10));

        if (this.materialNameToIndex.has (materialName)) {
            return this.materialNameToIndex.get (materialName);
        } else {
			let material = new PhongMaterial ();
            material.name = materialName;
			material.color = color;
            material.opacity = ifcColor.w;
            UpdateMaterialTransparency (material);
            let materialIndex = this.model.AddMaterial (material);
            this.materialNameToIndex.set (materialName, materialIndex);
            return materialIndex;
        }
    }

    GetIFCString (ifcString)
    {
        let decoded = this.DecodeIFCString (ifcString);
        if (decoded.length === 0) {
            decoded = '-';
        }
        return decoded;
    }

    DecodeIFCString (ifcString)
    {
        // TODO: https://github.com/tomvandig/web-ifc/issues/58
        const ifcUnicodeRegEx = /\\X2\\(.*?)\\X0\\/uig;
        let resultString = ifcString;
        let match = ifcUnicodeRegEx.exec (ifcString);
        while (match) {
            const unicodeChar = String.fromCharCode (parseInt (match[1], 16));
            resultString = resultString.replace (match[0], unicodeChar);
            match = ifcUnicodeRegEx.exec (ifcString);
        }
        return resultString;
    }
}
