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
			OV.LoadExternalLibrary ('loaders/rhino3dm.min.js').then (() => {
				rhino3dm ().then ((rhino) => {
					this.rhino = rhino;
					this.ImportRhinoContent (fileContent);
					onFinish ();
				});
            }).catch (() => {
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
			this.SetError ('Failed to read Rhino file.');
			return;
		}
		this.ImportRhinoDocument (rhinoDoc);
        if (OV.IsModelEmpty (this.model)) {
			this.SetError ('The model doesn\'t contain any 3D meshes. Try to save the model while you are in shaded view in Rhino.');
        }
	}

	ImportRhinoDocument (rhinoDoc)
	{
		this.InitRhinoInstances (rhinoDoc);
		this.ImportRhinoUserStrings (rhinoDoc);
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

	ImportRhinoUserStrings (rhinoDoc)
	{
		let docStrings = rhinoDoc.strings ();
		if (docStrings.count () > 0) {
			let propertyGroup = new OV.PropertyGroup ('Document user texts');
			for (let i = 0; i < docStrings.count (); i++) {
				let docString = docStrings.get (i);
				propertyGroup.AddProperty (new OV.Property (OV.PropertyType.Text, docString[0], docString[1]));
			}
			this.model.AddPropertyGroup (propertyGroup);
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

		let materialIndex = this.GetMaterialIndex (rhinoDoc, rhinoObject, rhinoInstanceReferences);
		let threeJson = rhinoMesh.toThreejsJSON ();
		let mesh = OV.ConvertThreeGeometryToMesh (threeJson.data, materialIndex);
		mesh.SetName (rhinoAttributes.name);

		let userStrings = rhinoAttributes.getUserStrings ();
		if (userStrings.length > 0) {
			let propertyGroup = new OV.PropertyGroup ('User texts');
			for (let i = 0; i < userStrings.length; i++) {
				let userString = userStrings[i];
				propertyGroup.AddProperty (new OV.Property (OV.PropertyType.Text, userString[0], userString[1]));
			}
			mesh.AddPropertyGroup (propertyGroup);
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
				if (layerIndex > -1) {
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

			let material = null;
			if (rhinoMaterial === null) {
				material = new OV.Material (OV.MaterialType.Phong);
				material.color.Set (255, 255, 255);
			} else {
				let physicallyBased = rhinoMaterial.physicallyBased ();
				if (physicallyBased.supported) {
					material = new OV.Material (OV.MaterialType.Physical);
					material.metalness = physicallyBased.metallic ? 1.0 : 0.0;
					material.roughness = physicallyBased.roughness;
				} else {
					material = new OV.Material (OV.MaterialType.Phong);
					SetColor (material.ambient, rhinoMaterial.ambientColor);
					SetColor (material.specular, rhinoMaterial.specularColor);
				}
				material.name = rhinoMaterial.name;
				SetColor (material.color, rhinoMaterial.diffuseColor);
				material.opacity = 1.0 - rhinoMaterial.transparency;
				OV.UpdateMaterialTransparency (material);
				// material.shininess = rhinoMaterial.shine / 255.0;
				if (IsBlack (material.color) && !IsWhite (rhinoMaterial.reflectionColor)) {
					SetColor (material.color, rhinoMaterial.reflectionColor);
				}
				if (IsBlack (material.color) && !IsWhite (rhinoMaterial.transparentColor)) {
					SetColor (material.color, rhinoMaterial.transparentColor);
				}
			}
			for (let i = 0; i < model.MaterialCount (); i++) {
				let current = model.GetMaterial (i);
				if (OV.MaterialIsEqual (current, material)) {
					return i;
				}
			}
			return model.AddMaterial (material);
		}

		let rhinoMaterial = GetRhinoMaterial (this.rhino, rhinoObject, rhinoInstanceReferences);
		return FindMatchingMaterial (this.model, rhinoMaterial);
	}
};
