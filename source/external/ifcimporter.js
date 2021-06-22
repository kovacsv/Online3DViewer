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
	}

    ResetContent ()
    {
        this.materialNameToIndex = {};
    }

    ImportContent (fileContent, onFinish)
    {
		if (this.ifc === null) {
			let obj = this;
			OV.LoadExternalLibrary ('web-ifc-api.js', {
				success : function () {
					obj.ifc = new IfcAPI ();
                    obj.ifc.Init ().then (function () {
                        obj.ImportIfcContent (fileContent);
                        onFinish ();
                    });
				},
				error : function () {
					onFinish ();
				}
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

        this.model.AddMesh (mesh);
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
			let material = new OV.Material ();
            material.name = materialName;
			material.diffuse = color;
            material.opacity = ifcColor.w;
            OV.UpdateMaterialTransparency (material);
            materialIndex = this.model.AddMaterial (material);
            this.materialNameToIndex[materialName] = materialIndex;
        }
        return materialIndex;
    }
};
