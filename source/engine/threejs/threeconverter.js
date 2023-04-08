import { RunTasksBatch } from '../core/taskrunner.js';
import { IsEqual } from '../geometry/geometry.js';
import { CreateObjectUrl, CreateObjectUrlWithMimeType } from '../io/bufferutils.js';
import { MaterialType } from '../model/material.js';
import { MeshInstance, MeshInstanceId } from '../model/meshinstance.js';
import { GetMeshType, MeshType } from '../model/meshutils.js';
import { ConvertColorToThreeColor, GetShadingType, ShadingType } from './threeutils.js';

import * as THREE from 'three';

export class ModelToThreeConversionParams
{
	constructor ()
	{
		this.forceMediumpForMaterials = false;
	}
}

export class ModelToThreeConversionOutput
{
	constructor ()
	{
		this.defaultMaterial = null;
		this.objectUrls = [];
	}
}

export class ThreeConversionStateHandler
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
}

export class ThreeNodeTree
{
	constructor (model, threeRootNode)
	{
		this.model = model;
		this.threeNodeItems = [];
		this.AddNode (model.GetRootNode (), threeRootNode);
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
			let id = new MeshInstanceId (node.GetId (), meshIndex);
			let mesh = this.model.GetMesh (meshIndex);
			this.threeNodeItems.push ({
				meshInstance : new MeshInstance (id, node, mesh),
				threeNode : threeNode
			});
		}
	}

	GetNodeItems ()
	{
		return this.threeNodeItems;
	}
}

export function ConvertModelToThreeObject (model, params, output, callbacks)
{
	function CreateThreeMaterial (stateHandler, model, materialIndex, shadingType, params, output)
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

		function LoadTexture (stateHandler, threeMaterial, texture, output, onTextureLoaded)
		{
			if (texture === null || !texture.IsValid ()) {
				return;
			}
			let loader = new THREE.TextureLoader ();
			stateHandler.OnTextureNeeded ();
			let textureObjectUrl = null;
			if (texture.mimeType !== null) {
				textureObjectUrl = CreateObjectUrlWithMimeType (texture.buffer, texture.mimeType);
			} else {
				textureObjectUrl = CreateObjectUrl (texture.buffer);
			}
			output.objectUrls.push (textureObjectUrl);
			loader.load (textureObjectUrl,
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
		let baseColor = ConvertColorToThreeColor (material.color);
		if (material.vertexColors) {
			baseColor.setRGB (1.0, 1.0, 1.0);
		}

		let materialParams = {
			color : baseColor,
			vertexColors : material.vertexColors,
			opacity : material.opacity,
			transparent : material.transparent,
			alphaTest : material.alphaTest,
			side : THREE.DoubleSide
		};

		if (params.forceMediumpForMaterials) {
			materialParams.precision = 'mediump';
		}

		let threeMaterial = null;
		if (shadingType === ShadingType.Phong) {
			threeMaterial = new THREE.MeshPhongMaterial (materialParams);
			if (material.type === MaterialType.Phong) {
				let specularColor = ConvertColorToThreeColor (material.specular);
				if (IsEqual (material.shininess, 0.0)) {
					specularColor.setRGB (0.0, 0.0, 0.0);
				}
				threeMaterial.specular = specularColor;
				threeMaterial.shininess = material.shininess * 100.0;
				LoadTexture (stateHandler, threeMaterial, material.specularMap, output, (threeTexture) => {
					threeMaterial.specularMap = threeTexture;
				});
			}
		} else if (shadingType === ShadingType.Physical) {
			threeMaterial = new THREE.MeshStandardMaterial (materialParams);
			if (material.type === MaterialType.Physical) {
				threeMaterial.metalness = material.metalness;
				threeMaterial.roughness = material.roughness;
				LoadTexture (stateHandler, threeMaterial, material.metalnessMap, output, (threeTexture) => {
					threeMaterial.metalness = 1.0;
					threeMaterial.roughness = 1.0;
					threeMaterial.metalnessMap = threeTexture;
					threeMaterial.roughnessMap = threeTexture;
				});
			}
		}

		let emissiveColor = ConvertColorToThreeColor (material.emissive);
		threeMaterial.emissive = emissiveColor;

		LoadTexture (stateHandler, threeMaterial, material.diffuseMap, output, (threeTexture) => {
			if (!material.multiplyDiffuseMap) {
				threeMaterial.color.setRGB (1.0, 1.0, 1.0);
			}
			threeMaterial.map = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.bumpMap, output, (threeTexture) => {
			threeMaterial.bumpMap = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.normalMap, output, (threeTexture) => {
			threeMaterial.normalMap = threeTexture;
		});
		LoadTexture (stateHandler, threeMaterial, material.emissiveMap, output, (threeTexture) => {
			threeMaterial.emissiveMap = threeTexture;
		});

		if (material.isDefault) {
			output.defaultMaterial = threeMaterial;
		}

		return threeMaterial;
	}

	function CreateThreeMesh (meshInstance, modelThreeMaterials)
	{
		let mesh = meshInstance.mesh;
		let triangleCount = mesh.TriangleCount ();

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
		let modelToThreeMaterials = new Map ();

		let vertices = [];
		let vertexColors = [];
		let normals = [];
		let uvs = [];

		let groups = [];
		groups.push ({
			start : 0,
			end : -1
		});

		let meshHasVertexColors = (mesh.VertexColorCount () > 0);
		let meshHasUVs = (mesh.TextureUVCount () > 0);
		for (let i = 0; i < triangleIndices.length; i++) {
			let triangleIndex = triangleIndices[i];
			let triangle = mesh.GetTriangle (triangleIndex);

			let v0 = mesh.GetVertex (triangle.v0);
			let v1 = mesh.GetVertex (triangle.v1);
			let v2 = mesh.GetVertex (triangle.v2);
			vertices.push (v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

			if (triangle.HasVertexColors ()) {
				let vc0 = ConvertColorToThreeColor (mesh.GetVertexColor (triangle.c0));
				let vc1 = ConvertColorToThreeColor (mesh.GetVertexColor (triangle.c1));
				let vc2 = ConvertColorToThreeColor (mesh.GetVertexColor (triangle.c2));
				vertexColors.push (
					vc0.r, vc0.g, vc0.b,
					vc1.r, vc1.g, vc1.b,
					vc2.r, vc2.g, vc2.b
				);
			} else if (meshHasVertexColors) {
				vertexColors.push (
					0.0, 0.0, 0.0,
					0.0, 0.0, 0.0,
					0.0, 0.0, 0.0
				);
			}

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
			if (!modelToThreeMaterials.has (modelMaterialIndex)) {
				modelToThreeMaterials.set (modelMaterialIndex, meshThreeMaterials.length);
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
		if (vertexColors.length !== 0) {
			threeGeometry.setAttribute ('color', new THREE.Float32BufferAttribute (vertexColors, 3));
		}
		threeGeometry.setAttribute ('normal', new THREE.Float32BufferAttribute (normals, 3));
		if (uvs.length !== 0) {
			threeGeometry.setAttribute ('uv', new THREE.Float32BufferAttribute (uvs, 2));
		}
		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			threeGeometry.addGroup (group.start * 3, (group.end - group.start + 1) * 3, i);
		}

		let threeMesh = new THREE.Mesh (threeGeometry, meshThreeMaterials);
		threeMesh.name = mesh.GetName ();
		threeMesh.userData = {
			originalMeshInstance : meshInstance,
			originalMaterials : meshOriginalMaterials,
			threeMaterials : null
		};

		return threeMesh;
	}

	function ConvertMesh (threeObject, meshInstance, modelThreeMaterials)
	{
		let type = GetMeshType (meshInstance.mesh);
		if (type === MeshType.TriangleMesh) {
			let threeMesh = CreateThreeMesh (meshInstance, modelThreeMaterials);
			threeObject.add (threeMesh);
		}
	}

	function ConvertNodeHierarchy (threeRootNode, model, modelThreeMaterials, stateHandler)
	{
		let nodeTree = new ThreeNodeTree (model, threeRootNode);
		let threeNodeItems = nodeTree.GetNodeItems ();

		RunTasksBatch (threeNodeItems.length, 100, {
			runTask : (firstMeshInstanceIndex, lastMeshInstanceIndex, onReady) => {
				for (let meshInstanceIndex = firstMeshInstanceIndex; meshInstanceIndex <= lastMeshInstanceIndex; meshInstanceIndex++) {
					let nodeItem = threeNodeItems[meshInstanceIndex];
					ConvertMesh (nodeItem.threeNode, nodeItem.meshInstance, modelThreeMaterials);
				}
				onReady ();
			},
			onReady : () => {
				stateHandler.OnModelLoaded (threeRootNode);
			}
		});
	}

	let stateHandler = new ThreeConversionStateHandler (callbacks);
	let shadingType = GetShadingType (model);

	let modelThreeMaterials = [];
	for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
		let threeMaterial = CreateThreeMaterial (stateHandler, model, materialIndex, shadingType, params, output);
		modelThreeMaterials.push (threeMaterial);
	}

	let threeObject = new THREE.Object3D ();
	ConvertNodeHierarchy (threeObject, model, modelThreeMaterials, stateHandler);
}
