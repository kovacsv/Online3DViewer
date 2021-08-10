OV.ImporterIfc = class extends OV.ImporterBase
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
    
    GetKnownFileFormats ()
    {
        return {
            'ifc' : OV.FileFormat.Binary
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.Y;
    }

	ClearContent ()
	{
        this.materialNameToIndex = null;
        this.expressIDToMesh = null;
	}

    ResetContent ()
    {
        this.materialNameToIndex = {};
        this.expressIDToMesh = {};
    }

    ImportContent (fileContent, onFinish)
    {
		if (this.ifc === null) {
			OV.LoadExternalLibrary ('loaders/web-ifc-api.js').then (() => {
                this.ifc = new IfcAPI ();
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
            this.ImportIfcMesh (modelID, ifcMesh);
        }
        this.ImportProperties (modelID);
        this.ifc.CloseModel (modelID);
	}

    ImportIfcMesh (modelID, ifcMesh)
    {
        let mesh = new OV.Mesh ();
        mesh.SetName ('Mesh ' + ifcMesh.expressID.toString ());

        let vertexOffset = 0;
        const ifcGeometries = ifcMesh.geometries;
        for (let geometryIndex = 0; geometryIndex < ifcGeometries.size (); geometryIndex++) {
            const ifcGeometry = ifcGeometries.get (geometryIndex);
            const ifcGeometryData = this.ifc.GetGeometry (modelID, ifcGeometry.geometryExpressID);
            const ifcVertices = this.ifc.GetVertexArray (ifcGeometryData.GetVertexData (), ifcGeometryData.GetVertexDataSize ());
            const ifcIndices = this.ifc.GetIndexArray (ifcGeometryData.GetIndexData (), ifcGeometryData.GetIndexDataSize ());
            const materialIndex = this.GetMaterialIndexByColor (ifcGeometry.color);
            const matrix = new OV.Matrix (ifcGeometry.flatTransformation);
            const transformation = new OV.Transformation (matrix);

            for (let i = 0; i < ifcVertices.length; i += 6) {
                const x = ifcVertices[i];
                const y = ifcVertices[i + 1];
                const z = ifcVertices[i + 2];
                const coord = new OV.Coord3D (x, y, z);
                const transformed = transformation.TransformCoord3D (coord);
                mesh.AddVertex (transformed);
            }
            // TODO: normals
            for (let i = 0; i < ifcIndices.length; i += 3) {
                const v0 = ifcIndices[i];
                const v1 = ifcIndices[i + 1];
                const v2 = ifcIndices[i + 2];
                const triangle = new OV.Triangle (
                    vertexOffset + v0,
                    vertexOffset + v1,
                    vertexOffset + v2
                );
                triangle.SetMaterial (materialIndex);
                mesh.AddTriangle (triangle);
            }
            vertexOffset += ifcVertices.length / 6;
        }

        this.expressIDToMesh[ifcMesh.expressID] = mesh;
        this.model.AddMesh (mesh);
    }

    ImportProperties (modelID)
    {
        // TODO: var IFCRELDEFINESBYPROPERTIES = 4186316022;
        // TODO: var IFCBUILDING = 4031249490;
        const lines = this.ifc.GetLineIDsWithType (modelID, 4186316022);
        for (let i = 0; i < lines.size (); i++) {
            const relID = lines.get (i);
            const rel = this.ifc.GetLine (modelID, relID);
            rel.RelatedObjects.forEach ((objectRelID) => {
                let element = this.expressIDToMesh[objectRelID.value];
                if (element === undefined) {
                    let propSetOwner = this.ifc.GetLine (modelID, objectRelID.value, true);
                    if (propSetOwner.type === 4031249490) {
                        element = this.model;
                    } else {
                        return;
                    }
                }
                if (Array.isArray (rel.RelatingPropertyDefinition)) {
                    return;
                }
                let propSetDef = rel.RelatingPropertyDefinition;
                let propSet = this.ifc.GetLine (modelID, propSetDef.value, true);
                if (!propSet || !propSet.HasProperties) {
                    return;
                }
                let propertyGroup = new OV.PropertyGroup (propSet.Name.value);
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
                            elemProperty = new OV.Property (OV.PropertyType.Text, propertyName, this.GetIFCString (property.NominalValue.value));
                            break;
                        case 'IFCBOOLEAN':
                        case 'IFCLOGICAL':
                            strValue = 'Unknown';
                            if (property.NominalValue.value === 'T') {
                                strValue = 'True';
                            } else if (property.NominalValue.value === 'F') {
                                strValue = 'False';
                            }
                            elemProperty = new OV.Property (OV.PropertyType.Text, propertyName, strValue);
                            break;
                        case 'IFCINTEGER':
                        case 'IFCCOUNTMEASURE':
                            elemProperty = new OV.Property (OV.PropertyType.Integer, propertyName, property.NominalValue.value);
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
                            elemProperty = new OV.Property (OV.PropertyType.Number, propertyName, property.NominalValue.value);
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
        const color = new OV.Color (
            parseInt (ifcColor.x * 255.0, 10),
            parseInt (ifcColor.y * 255.0, 10),
            parseInt (ifcColor.z * 255.0, 10)
        );
    
        const materialName = 'Color ' +
            OV.IntegerToHexString (color.r) +
            OV.IntegerToHexString (color.g) +
            OV.IntegerToHexString (color.b) +
            OV.IntegerToHexString (parseInt (ifcColor.w * 255.0, 10));
        
        let materialIndex = this.materialNameToIndex[materialName];
        if (materialIndex === undefined) {
			let material = new OV.Material (OV.MaterialType.Phong);
            material.name = materialName;
			material.color = color;
            material.opacity = ifcColor.w;
            OV.UpdateMaterialTransparency (material);
            materialIndex = this.model.AddMaterial (material);
            this.materialNameToIndex[materialName] = materialIndex;
        }
        return materialIndex;
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
};
