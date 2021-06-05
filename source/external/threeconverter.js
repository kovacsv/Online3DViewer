OV.ModelToThreeConversionParams = class
{
	constructor ()
	{
		this.forceMediumpForMaterials = false;
	}
};

OV.ConvertModelToThreeMeshes = function (model, params, callbacks)
{
	function CreateThreeMaterial (model, materialIndex)
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

		function LoadTexture (threeMaterial, texture, onLoad)
		{
			if (texture === null || !texture.IsValid ()) {
				return;
			}
			let loader = new THREE.TextureLoader ();
			loader.load (texture.url, function (threeTexture) {
				SetTextureParameters (texture, threeTexture);
				threeTexture.image = OV.ResizeImageToPowerOfTwoSides (threeTexture.image);
				threeMaterial.needsUpdate = true;
				onLoad (threeTexture);
			});			
		}

		let material = model.GetMaterial (materialIndex);
		let diffuseColor = new THREE.Color (material.diffuse.r / 255.0, material.diffuse.g / 255.0, material.diffuse.b / 255.0);
		let specularColor = new THREE.Color (material.specular.r / 255.0, material.specular.g / 255.0, material.specular.b / 255.0);
		let emissiveColor = new THREE.Color (material.emissive.r / 255.0, material.emissive.g / 255.0, material.emissive.b / 255.0);
		if (OV.IsEqual (material.shininess, 0.0)) {
			specularColor.setRGB (0.0, 0.0, 0.0);
		}

		let materialParams = {
			color : diffuseColor,
			specular : specularColor,
			emissive : emissiveColor,
			shininess : material.shininess * 100.0,
			opacity : material.opacity,
			transparent : material.transparent,
			alphaTest : material.alphaTest,
			side : THREE.DoubleSide
		};
		if (params.forceMediumpForMaterials) {
			materialParams.precision = 'mediump';
		}

		let threeMaterial = new THREE.MeshPhongMaterial (materialParams);
		LoadTexture (threeMaterial, material.diffuseMap, function (threeTexture) {
			if (!material.multiplyDiffuseMap) {
				threeMaterial.color.setRGB (1.0, 1.0, 1.0);
			}
			threeMaterial.map = threeTexture;
			callbacks.onTextureLoaded ();
		});
		LoadTexture (threeMaterial, material.specularMap, function (threeTexture) {
			threeMaterial.specularMap = threeTexture;
			callbacks.onTextureLoaded ();
		});
		LoadTexture (threeMaterial, material.bumpMap, function (threeTexture) {
			threeMaterial.bumpMap = threeTexture;
			callbacks.onTextureLoaded ();
		});
		LoadTexture (threeMaterial, material.normalMap, function (threeTexture) {
			threeMaterial.normalMap = threeTexture;
			callbacks.onTextureLoaded ();
		});
		LoadTexture (threeMaterial, material.emissiveMap, function (threeTexture) {
			threeMaterial.emissiveMap = threeTexture;
			callbacks.onTextureLoaded ();
		});

		return threeMaterial;
	}

	function CreateThreeMesh (model, meshIndex, modelThreeMaterials)
	{
		let mesh = model.GetMesh (meshIndex);
		let triangleCount = mesh.TriangleCount ();
		if (triangleCount === 0) {
			return null;
		}

		let triangleIndices = [];
		for (let i = 0; i < triangleCount; i++) {
			triangleIndices.push (i);
		}
		triangleIndices.sort (function (a, b) {
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
			originalMeshIndex : meshIndex,
			originalMaterials : meshOriginalMaterials,
			threeMaterials : null
		};
		
		return threeMesh;
	}

	let modelThreeMaterials = [];
	for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
		let threeMaterial = CreateThreeMaterial (model, materialIndex);
		modelThreeMaterials.push (threeMaterial);
	}

	let threeMeshes = [];
	let taskRunner = new OV.TaskRunner ();
	taskRunner.Run (model.MeshCount (), {
		runTask : function (index, ready) {
			let mesh = model.GetMesh (index);
			if (mesh.TriangleCount () === 0) {
				ready ();
			} else {
				let threeMesh = CreateThreeMesh (model, index, modelThreeMaterials);
				threeMeshes.push (threeMesh);
				ready ();
			}
		},
		onReady : function () {
			callbacks.onModelLoaded (threeMeshes);
		}
	});
};
