OV.Importer3dm = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
		this.rhino = null;
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
        return OV.Direction.Z;
    }

	ClearContent ()
	{
		this.instanceObjects = null;
		this.instanceDefinitions = null;
	}

    ResetContent ()
    {
		this.instanceObjects = {};
		this.instanceDefinitions = {};
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
		if (rhinoDoc === null) {
			this.SetError ();
			this.SetMessage ('Failed to read Rhino file.');
			return;
		}
		this.ImportRhinoDocument (rhinoDoc);
        if (OV.IsModelEmpty (this.model)) {
			this.SetError ();
			this.SetMessage ('The model doesn\'t contain any 3D meshes. Try to save the model while you are in shaded view in Rhino.');
        }
	}

	ImportRhinoDocument (rhinoDoc)
	{
		this.InitRhinoInstances (rhinoDoc);
		this.ImportRhinoGeometry (rhinoDoc);
	}

	InitRhinoInstances (rhinoDoc)
	{
		let rhinoObjects = rhinoDoc.objects ();
		for (let i = 0; i < rhinoObjects.count; i++) {
			let rhinoObject = rhinoObjects.get (i);
			let rhinoAttributes = rhinoObject.attributes ();
			if (rhinoAttributes.isInstanceDefinitionObject) {
				this.instanceObjects[rhinoAttributes.id] = rhinoObject;
			}
		}
		let rhinoInstanceDefinitions = rhinoDoc.instanceDefinitions ();
		for (let i = 0; i < rhinoInstanceDefinitions.count (); i++) {
			let rhinoInstanceDefinition = rhinoInstanceDefinitions.get (i);
			this.instanceDefinitions[rhinoInstanceDefinition.id] = rhinoInstanceDefinition;
		}
	}

	ImportRhinoGeometry (rhinoDoc)
	{
		let rhinoObjects = rhinoDoc.objects ();
		for (let i = 0; i < rhinoObjects.count; i++) {
			let rhinoObject = rhinoObjects.get (i);
			this.ImportRhinoGeometryObject (rhinoDoc, rhinoObject, []);		
		}
	}

	ImportRhinoGeometryObject (rhinoDoc, rhinoObject, rhinoInstanceReferences)
	{
		let rhinoGeometry = rhinoObject.geometry ();
		let rhinoAttributes = rhinoObject.attributes ();

		let objectType = rhinoGeometry.objectType;
		if (rhinoAttributes.isInstanceDefinitionObject && rhinoInstanceReferences.length === 0) {
			return;
		}		
	
		let rhinoMesh = null;
		let deleteMesh = false;

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
		} else if (objectType === this.rhino.ObjectType.SubD) {
			rhinoGeometry.subdivide (3);
			rhinoMesh = this.rhino.Mesh.createFromSubDControlNet (rhinoGeometry);
			deleteMesh = true;
		} else if (objectType === this.rhino.ObjectType.InstanceReference) {
			let parentDefinitionId = rhinoGeometry.parentIdefId;
			let instanceDefinition = this.instanceDefinitions[parentDefinitionId]; 
			if (instanceDefinition !== undefined) {
				let instanceObjectIds = instanceDefinition.getObjectIds ();
				for (let i = 0; i < instanceObjectIds.length; i++) {
					let instanceObjectId = instanceObjectIds[i];
					let instanceObject = this.instanceObjects[instanceObjectId];
					if (instanceObject !== undefined) {
						rhinoInstanceReferences.push (rhinoObject);
						this.ImportRhinoGeometryObject (rhinoDoc, instanceObject, rhinoInstanceReferences);
						rhinoInstanceReferences.pop ();
					}
				}
			}
		}

		if (rhinoMesh !== null) {
			this.ImportRhinoMesh (rhinoDoc, rhinoMesh, rhinoObject, rhinoInstanceReferences);
			if (deleteMesh) {
				rhinoMesh.delete ();
			}
		}
	}

	ImportRhinoMesh (rhinoDoc, rhinoMesh, rhinoObject, rhinoInstanceReferences)
	{
		let rhinoAttributes = rhinoObject.attributes ();

		let mesh = new OV.Mesh ();
		mesh.SetName (rhinoAttributes.name);

		let materialIndex = this.GetMaterialIndex (rhinoDoc, rhinoObject, rhinoInstanceReferences);
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
		if (rhinoInstanceReferences.length !== 0) {
			let matrix = new OV.Matrix ().CreateIdentity ();
			for (let i = rhinoInstanceReferences.length - 1; i >= 0; i--) {
				let rhinoInstanceReference = rhinoInstanceReferences[i];
				let rhinoInstanceReferenceGeometry = rhinoInstanceReference.geometry ();
				let rhinoInstanceReferenceMatrix = rhinoInstanceReferenceGeometry.xform.toFloatArray (false);
				let transformationMatrix = new OV.Matrix (rhinoInstanceReferenceMatrix);
				matrix = matrix.MultiplyMatrix (transformationMatrix);
			}
			let transformation = new OV.Transformation (matrix);
			OV.TransformMesh (mesh, transformation);
		}
		this.model.AddMesh (mesh);
	}

	GetMaterialIndex (rhinoDoc, rhinoObject, rhinoInstanceReferences)
	{
		function GetRhinoMaterial (rhino, rhinoObject, rhinoInstanceReferences)
		{
			let rhinoAttributes = rhinoObject.attributes ();
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
				if (rhinoInstanceReferences.length !== 0) {
					return GetRhinoMaterial (rhino, rhinoInstanceReferences[0], []);
				}
			}
			return null;
		}

		function FindMatchingMaterial (model, rhinoMaterial)
		{
			function SetColor (color, rhinoColor)
			{
				color.Set (rhinoColor.r, rhinoColor.g, rhinoColor.b);
			}

			function IsBlack (rhinoColor)
			{
				return rhinoColor.r === 0 && rhinoColor.g === 0 && rhinoColor.b === 0;
			}

			function IsWhite (rhinoColor)
			{
				return rhinoColor.r === 255 && rhinoColor.g === 255 && rhinoColor.b === 255;
			}

			let material = new OV.Material ();
			if (rhinoMaterial === null) {
				material.diffuse.Set (255, 255, 255);
			} else {
				material.name = rhinoMaterial.name;
				SetColor (material.ambient, rhinoMaterial.ambientColor);
				SetColor (material.diffuse, rhinoMaterial.diffuseColor);
				SetColor (material.specular, rhinoMaterial.specularColor);
				material.opacity = 1.0 - rhinoMaterial.transparency;
				OV.UpdateMaterialTransparency (material);
				// material.shininess = rhinoMaterial.shine / 255.0;
				if (IsBlack (material.diffuse) && !IsWhite (rhinoMaterial.reflectionColor)) {
					SetColor (material.diffuse, rhinoMaterial.reflectionColor);
				}
				if (IsBlack (material.diffuse) && !IsWhite (rhinoMaterial.transparentColor)) {
					SetColor (material.diffuse, rhinoMaterial.transparentColor);
				}
			}
			for (let i = 0; i < model.MaterialCount (); i++) {
				let current = model.GetMaterial (i);
				if (current.name !== material.name) {
					continue;
				}
				if (!OV.ColorIsEqual (current.ambient, material.ambient)) {
					continue;
				}
				if (!OV.ColorIsEqual (current.diffuse, material.diffuse)) {
					continue;
				}
				if (!OV.ColorIsEqual (current.specular, material.specular)) {
					continue;
				}
				if (!OV.IsEqual (current.opacity, material.opacity)) {
					continue;
				}
				if (current.transparent !== material.transparent) {
					continue;
				}
				if (!OV.IsEqual (current.shininess, material.shininess)) {
					continue;
				}
				return i;
			}
			return model.AddMaterial (material);
		}

		let rhinoMaterial = GetRhinoMaterial (this.rhino, rhinoObject, rhinoInstanceReferences);
		return FindMatchingMaterial (this.model, rhinoMaterial);
	}
};
