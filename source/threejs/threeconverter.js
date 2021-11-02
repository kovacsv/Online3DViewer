OV.ModelToThreeConversionParams = class
{
	constructor ()
	{
		this.forceMediumpForMaterials = false;
	}
};

OV.ModelToThreeConversionOutput = class
{
	constructor ()
	{
		this.defaultMaterial = null;
	}
};

OV.ThreeConversionStateHandler = class
{
	constructor (callbacks)
	{
		this.callbacks = callbacks;
		this.texturesNeeded = 0;
		this.texturesLoaded = 0;
		this.threeObject = null;
	}

	OnTextureNeeded ()
	{
		this.texturesNeeded += 1;
	}

	OnTextureLoaded ()
	{
		this.texturesLoaded += 1;
		this.callbacks.onTextureLoaded ();
		this.Finish ();
	}

	OnModelLoaded (threeObject)
	{
		this.threeObject = threeObject;
		this.Finish ();
	}

	Finish ()
	{
		if (this.threeObject !== null && this.texturesNeeded === this.texturesLoaded) {
			this.callbacks.onModelLoaded (this.threeObject);
		}
	}
};

OV.ThreeNodeTree = class
{
	constructor (rootNode, threeRootNode)
	{
		this.meshInstances = [];
		this.AddNode (rootNode, threeRootNode);
	}

	AddNode (node, threeNode)
	{
		let matrix = node.GetTransformation ().GetMatrix ();
		let threeMatrix = new THREE.Matrix4 ().fromArray (matrix.Get ());
		threeNode.applyMatrix4 (threeMatrix);

		for (let childNode of node.GetChildNodes ()) {
			let threeChildNode = new THREE.Object3D ();
			threeNode.add (threeChildNode);
			this.AddNode (childNode, threeChildNode);
		}
		for (let meshIndex of node.GetMeshIndices ()) {
			this.meshInstances.push ({
				node : node,
				threeNode : threeNode,
				meshIndex : meshIndex
			});
		}
	}

	GetMeshInstances ()
	{
		return this.meshInstances;
	}
};

OV.ConvertModelToThreeObject = function (model, params, output, callbacks)
{
	function CreateThreeMaterial (stateHandler, model, materialIndex, materialType, params, output)
	{
		function SetTextureParameters (texture, threeTexture)
		{
			threeTexture.wrapS = THREE.RepeatWrapping;
			threeTexture.wrapT = THREE.RepeatWrapping;
			threeTexture.rotation = texture.rotation;
			threeTexture.offset.x = texture.offset.x;
			threeTexture.offset.y = texture.offset.y;
			threeTexture.repeat.x = texture.scale.x;
			threeTexture.repeat.y = texture.scale.y;
		}

		function LoadTexture (stateHandler, threeMaterial, texture, onTextureLoaded)
		{
			if (texture === null || !texture.IsValid ()) {
				return;
			}
			let loader = new THREE.TextureLoader ();
			stateHandler.OnTextureNeeded ();
			loader.load (texture.url,
				(threeTexture) => {
					SetTextureParameters (texture, threeTexture);
					threeMaterial.needsUpdate = true;
					onTextureLoaded (threeTexture);
					stateHandler.OnTextureLoaded ();
				},
				null,
				(err) => {
					stateHandler.OnTextureLoaded ();
				}
			);
		}

		let material = model.GetMaterial (materialIndex);
		let baseColor = new THREE.Color (material.color.r / 255.0, material.color.g / 255.0, material.color.b / 255.0);

		let materialParams = {
			color : baseColor,
			opacity : material.opacity,
			transparent : material.transparent,
			alphaTest : material.alphaTest,
			side : THREE.DoubleSide
		};

		if (params.forceMediumpForMaterials) {
			materialParams.precision = 'mediump';
		}

		let threeMaterial = null;
		if (materialType === OV.MaterialType.Phong) {
			threeMaterial = new THREE.MeshPhongMaterial (materialParams);
			let specularColor = new THREE.Color (material.specular.r / 255.0, material.specular.g / 255.0, material.specular.b / 255.0);
			if (OV.IsEqual (material.shininess, 0.0)) {
				specularColor.setRGB (0.0, 0.0, 0.0);
			}
			threeMaterial.specular = specularColor;
			threeMaterial.shininess = material.shininess * 100.0;
			LoadTexture (stateHandler, threeMaterial, material.specularMap, (threeTexture) => {
				threeMaterial.specularMap = threeTexture;
			});
		} else if (materialType === OV.MaterialType.Physical) {
			threeMaterial = new THREE.MeshStandardMaterial (materialParams);
			threeMaterial.metalness = material.metalness;
			threeMaterial.roughness = material.roughness;
			LoadTexture (stateHandler, threeMaterial, material.metalnessMap, (threeTexture) => {
				threeMaterial.metalness = 1.0;
				threeMaterial.roughness = 1.0;
				threeMaterial.metalnessMap = threeTexture;
				threeMaterial.roughnessMap = threeTexture;
			});
		}

		let emissiveColor = new THREE.Color (material.emissive.r / 255.0, material.emissive.g / 255.0, material.emissive.b / 255.0);
		threeMaterial.emissive = emissiveColor;

		LoadTexture (stateHandler, threeMaterial, material.diffuseMap, (threeTexture) => {
			if (!material.multiplyDiffuseMap) {
				threeMaterial.color.setRGB (1.0, 1.0, 1.0);
			}
			threeMaterial.map = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.bumpMap, (threeTexture) => {
			threeMaterial.bumpMap = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.normalMap, (threeTexture) => {
			threeMaterial.normalMap = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.emissiveMap, (threeTexture) => {
			threeMaterial.emissiveMap = threeTexture;
		});

		if (material.isDefault) {
			output.defaultMaterial = threeMaterial;
		}

		return threeMaterial;
	}

	function CreateThreeMesh (model, meshInstanceId, modelThreeMaterials)
	{
		let mesh = model.GetMesh (meshInstanceId.meshIndex);
		let triangleCount = mesh.TriangleCount ();
		if (triangleCount === 0) {
			return null;
		}

		let triangleIndices = [];
		for (let i = 0; i < triangleCount; i++) {
			triangleIndices.push (i);
		}
		triangleIndices.sort ((a, b) => {
			let aTriangle = mesh.GetTriangle (a);
			let bTriangle = mesh.GetTriangle (b);
			return aTriangle.mat - bTriangle.mat;
		});

		let threeGeometry = new THREE.BufferGeometry ();
		let meshThreeMaterials = [];
		let meshOriginalMaterials = [];
		let modelToThreeMaterials = {};

		let vertices = [];
		let normals = [];
		let uvs = [];

		let groups = [];
		groups.push ({
			start : 0,
			end : -1
		});

		let meshHasUVs = mesh.TextureUVCount () > 0;
		for (let i = 0; i < triangleIndices.length; i++) {
			let triangleIndex = triangleIndices[i];
			let triangle = mesh.GetTriangle (triangleIndex);

			let v0 = mesh.GetVertex (triangle.v0);
			let v1 = mesh.GetVertex (triangle.v1);
			let v2 = mesh.GetVertex (triangle.v2);
			vertices.push (v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

			let n0 = mesh.GetNormal (triangle.n0);
			let n1 = mesh.GetNormal (triangle.n1);
			let n2 = mesh.GetNormal (triangle.n2);
			normals.push (n0.x, n0.y, n0.z, n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);

			if (triangle.HasTextureUVs ()) {
				let u0 = mesh.GetTextureUV (triangle.u0);
				let u1 = mesh.GetTextureUV (triangle.u1);
				let u2 = mesh.GetTextureUV (triangle.u2);
				uvs.push (u0.x, u0.y, u1.x, u1.y, u2.x, u2.y);
			} else if (meshHasUVs) {
				uvs.push (0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
			}

			let modelMaterialIndex = triangle.mat;
			let materialIndex = modelToThreeMaterials[modelMaterialIndex];
			if (materialIndex === undefined) {
				materialIndex = meshThreeMaterials.length;
				modelToThreeMaterials[modelMaterialIndex] = materialIndex;
				meshThreeMaterials.push (modelThreeMaterials[modelMaterialIndex]);
				meshOriginalMaterials.push (modelMaterialIndex);
				if (i > 0) {
					groups[groups.length - 1].end = i - 1;
					groups.push ({
						start : groups[groups.length - 1].end + 1,
						end : -1
					});
				}
			}
		}

		groups[groups.length - 1].end = triangleCount - 1;

		threeGeometry.setAttribute ('position', new THREE.Float32BufferAttribute (vertices, 3));
		threeGeometry.setAttribute ('normal', new THREE.Float32BufferAttribute (normals, 3));
		if (uvs.length !== 0) {
			threeGeometry.setAttribute ('uv', new THREE.Float32BufferAttribute (uvs, 2));
		}
		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			threeGeometry.addGroup (group.start * 3, (group.end - group.start + 1) * 3, i);
		}

		let threeMesh = new THREE.Mesh (threeGeometry, meshThreeMaterials);
		threeMesh.userData = {
			originalMeshId : meshInstanceId,
			originalMaterials : meshOriginalMaterials,
			threeMaterials : null
		};

		return threeMesh;
	}

	function ConvertMesh (threeObject, model, meshInstanceId, modelThreeMaterials)
	{
		let mesh = model.GetMesh (meshInstanceId.meshIndex);
		if (mesh.TriangleCount () > 0) {
			let threeMesh = CreateThreeMesh (model, meshInstanceId, modelThreeMaterials);
			threeObject.add (threeMesh);
		}
	}

	function ConvertNodeHierarchy (threeRootNode, model, modelThreeMaterials, stateHandler)
	{
		let rootNode = model.GetRootNode ();
		let nodeTree = new OV.ThreeNodeTree (rootNode, threeRootNode);
		let meshInstances = nodeTree.GetMeshInstances ();

		OV.RunTasksBatch (meshInstances.length, 100, {
			runTask : (firstMeshInstanceIndex, lastMeshInstanceIndex, onReady) => {
				for (let meshInstanceIndex = firstMeshInstanceIndex; meshInstanceIndex <= lastMeshInstanceIndex; meshInstanceIndex++) {
					let meshInstance = meshInstances[meshInstanceIndex];
					let node = meshInstance.node;
					let threeNode = meshInstance.threeNode;
					let meshInstanceId = new OV.MeshInstanceId (node.GetId (), meshInstance.meshIndex);
					ConvertMesh (threeNode, model, meshInstanceId, modelThreeMaterials);
				}
				onReady ();
			},
			onReady : () => {
				stateHandler.OnModelLoaded (threeRootNode);
			}
		});
	}

	let stateHandler = new OV.ThreeConversionStateHandler (callbacks);
	let materialType = OV.GetRepresentativeMaterialType (model);

	let modelThreeMaterials = [];
	for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
		let threeMaterial = CreateThreeMaterial (stateHandler, model, materialIndex, materialType, params, output);
		modelThreeMaterials.push (threeMaterial);
	}

	let threeObject = new THREE.Object3D ();
	ConvertNodeHierarchy (threeObject, model, modelThreeMaterials, stateHandler);
};
