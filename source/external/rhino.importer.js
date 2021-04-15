OV.Importer3dm = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
		this.rhino = null;
		this.colorToMaterial = null;
		this.materialNameToIndex = null;
    }
    
    ResetState ()
    {
		this.colorToMaterial = {};
		this.materialNameToIndex = {};
    }

    CanImportExtension (extension)
    {
        return extension === '3dm';
    }
    
    GetKnownFileFormats ()
    {
        return {
    		'3dm' : OV.FileFormat.Binary
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.X;
    }

    ImportContent (fileContent, onFinish)
    {
		if (this.rhino === null) {
			let obj = this;
			rhino3dm ().then (function (rhino) {
				obj.rhino = rhino;
				obj.ImportRhinoContent (fileContent);
				onFinish ();
			});
		} else {
			this.ImportRhinoContent (fileContent);
			onFinish ();
		}
    }

	ImportRhinoContent (fileContent)
	{
		let rhinoDoc = this.rhino.File3dm.fromByteArray (fileContent);
		this.ImportRhinoDocument (rhinoDoc);
	}

	ImportRhinoDocument (rhinoDoc)
	{
		let rhinoObjects = rhinoDoc.objects ();
		for (let i = 0; i < rhinoObjects.count; i++) {
			let rhinoObject = rhinoObjects.get (i);
			this.ImportRhinoObject (rhinoDoc, rhinoObject);
		}
	}

	ImportRhinoObject (rhinoDoc, rhinoObject)
	{
		let rhinoMesh = null;
		let deleteMesh = false;

		let rhinoGeometry = rhinoObject.geometry ();
		let rhinoAttributes = rhinoObject.attributes ();
		if (rhinoAttributes.isInstanceDefinitionObject) {
			// TODO: handle instances
			return;
		}

		let objectType = rhinoGeometry.objectType;
		if (objectType === this.rhino.ObjectType.Mesh) {
			rhinoMesh = rhinoGeometry;
			deleteMesh = false;
		} else if (objectType === this.rhino.ObjectType.Extrusion) {
			rhinoMesh = rhinoGeometry.getMesh (this.rhino.MeshType.Any);
			deleteMesh = true;
		} else if (objectType === this.rhino.ObjectType.Brep) {
			rhinoMesh = new this.rhino.Mesh ();
			let faces = rhinoGeometry.faces ();
			for (let i = 0; i < faces.count; i++) {
				let face = faces.get (i);
				let mesh = face.getMesh (this.rhino.MeshType.Any);
				if (mesh) {
					rhinoMesh.append (mesh);
					mesh.delete ();
				}
				face.delete ();
			}
			faces.delete ();
			rhinoMesh.compact ();
			deleteMesh = true;
		}

		if (rhinoMesh !== null) {
			this.ImportRhinoMesh (rhinoDoc, rhinoMesh, rhinoAttributes);
			if (deleteMesh) {
				rhinoMesh.delete ();
			}
		}
	}

	ImportRhinoMesh (rhinoDoc, rhinoMesh, rhinoAttributes)
	{
		let mesh = new OV.Mesh ();
		mesh.SetName (rhinoAttributes.name);

		let materialIndex = this.GetMaterialIndex (rhinoDoc, rhinoAttributes);
		let threeJson = rhinoMesh.toThreejsJSON ();
		let vertices = threeJson.data.attributes.position.array;
		for (let i = 0; i < vertices.length; i += 3) {
			let x = vertices[i];
			let y = vertices[i + 1];
			let z = vertices[i + 2];
			mesh.AddVertex (new OV.Coord3D (x, y, z));
		}
		let hasNormals = (threeJson.data.attributes.normal !== undefined);
		if (hasNormals) {
			let normals = threeJson.data.attributes.normal.array;
			for (let i = 0; i < normals.length; i += 3) {
				let x = normals[i];
				let y = normals[i + 1];
				let z = normals[i + 2];
				mesh.AddNormal (new OV.Coord3D (x, y, z));
			}		
		}
		let hasUVs = (threeJson.data.attributes.uv !== undefined);
		if (hasUVs) {
			let uvs = threeJson.data.attributes.uv.array;
			for (let i = 0; i < uvs.length; i += 2) {
				let x = uvs[i];
				let y = uvs[i + 1];
				mesh.AddTextureUV (new OV.Coord2D (x, y));
			}		
		}
		let indices = threeJson.data.index.array;
		for (let i = 0; i < indices.length; i += 3) {
			let v0 = indices[i];
			let v1 = indices[i + 1];
			let v2 = indices[i + 2];
			let triangle = new OV.Triangle (v0, v1, v2);
			if (hasNormals) {
				triangle.SetNormals (v0, v1, v2);
			}
			if (hasUVs) {
				triangle.SetTextureUVs (v0, v1, v2);
			}
			if (materialIndex !== null) {
				triangle.SetMaterial (materialIndex);
			}
			mesh.AddTriangle (triangle);
		}
		this.model.AddMesh (mesh);
	}

	GetMaterialIndex (rhinoDoc, rhinoAttributes)
	{
		function IntegerToHex (intVal)
		{
			let result = parseInt (intVal, 10).toString (16);
			while (result.length < 2) {
				result = '0' + result;
			}
			return result;
		}

		function GetMaterial (rhino, rhinoAttributes)
		{
			if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromObject) {
				let materialIndex = rhinoAttributes.materialIndex;
				if (materialIndex > -1) {
					return rhinoDoc.materials ().get (materialIndex);
				}
			} else if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromLayer) {
				let layerIndex = rhinoAttributes.layerIndex;
				if (layerIndex > 0) {
					let layer = rhinoDoc.layers ().get (layerIndex);
					let layerMaterialIndex = layer.renderMaterialIndex;
					if (layerMaterialIndex > -1) {
						return rhinoDoc.materials ().get (layerMaterialIndex);
					}
				}
			} else if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromParent) {
				// TODO: handle instances
			}
			return null;
		}

		function GetColor (rhino, rhinoAttributes)
		{
			if (rhinoAttributes.colorSource === rhino.ObjectColorSource.ColorFromObject) {
				return rhinoAttributes.objectColor;
			} else if (rhinoAttributes.colorSource === rhino.ObjectColorSource.ColorFromLayer) {
				let layerIndex = rhinoAttributes.layerIndex;
				if (layerIndex > 0) {
					let layer = rhinoDoc.layers ().get (layerIndex);
					return layer.color;
				}
			} else if (rhinoAttributes.colorSource === rhino.ObjectColorSource.ColorFromParent) {
				// TODO: handle instances
			}
			return null;
		}		

		let rhinoColor = null;

		let rhinoMaterial = GetMaterial (this.rhino, rhinoAttributes);
		if (rhinoMaterial !== null) {
			rhinoColor = rhinoMaterial.diffuseColor;
		}
		if (rhinoColor === null) {
			rhinoColor = GetColor (this.rhino, rhinoAttributes);
		}

		let color = new OV.Color (255, 255, 255);
		if (rhinoColor !== null) {
			color = new OV.Color (rhinoColor.r, rhinoColor.g, rhinoColor.b);
		}

		// TODO: transparency?
		let materialName = 'Color ' + IntegerToHex (color.r) + IntegerToHex (color.g) + IntegerToHex (color.b);
		let materialIndex = this.colorToMaterial[materialName];
		if (materialIndex === undefined) {
			let material = new OV.Material ();
			if (rhinoMaterial !== null) {
				material.name = rhinoMaterial.name;
			} else {
				material.name = materialName;
			}
			material.diffuse = color;
			materialIndex = this.model.AddMaterial (material);
			this.colorToMaterial[materialName] = materialIndex;
		}
		return materialIndex;
	}
};
