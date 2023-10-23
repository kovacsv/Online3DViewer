import { RunTasksBatch } from '../core/taskrunner.js';
import { IsEqual } from '../geometry/geometry.js';
import { CreateObjectUrl, CreateObjectUrlWithMimeType } from '../io/bufferutils.js';
import { MaterialSource, MaterialType } from '../model/material.js';
import { MeshInstance, MeshInstanceId } from '../model/meshinstance.js';
import { IsEmptyMesh } from '../model/meshutils.js';
import { ConvertColorToThreeColor, GetShadingType, ShadingType } from './threeutils.js';

import * as THREE from 'three';

export const MaterialGeometryType =
{
	Line : 1,
	Face : 2
};

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
		this.defaultMaterials = [];
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

export class ThreeMaterialHandler
{
	constructor (model, stateHandler, conversionParams, conversionOutput)
	{
		this.model = model;
		this.stateHandler = stateHandler;
		this.conversionParams = conversionParams;
		this.conversionOutput = conversionOutput;

		this.shadingType = GetShadingType (model);
		this.modelToThreeLineMaterial = new Map ();
		this.modelToThreeMaterial = new Map ();
	}

	GetThreeMaterial (modelMaterialIndex, geometryType)
	{
		if (geometryType === MaterialGeometryType.Face) {
			if (!this.modelToThreeMaterial.has (modelMaterialIndex)) {
				let threeMaterial = this.CreateThreeFaceMaterial (modelMaterialIndex);
				this.modelToThreeMaterial.set (modelMaterialIndex, threeMaterial);
			}
			return this.modelToThreeMaterial.get (modelMaterialIndex);
		} else if (geometryType === MaterialGeometryType.Line) {
			if (!this.modelToThreeLineMaterial.has (modelMaterialIndex)) {
				let threeMaterial = this.CreateThreeLineMaterial (modelMaterialIndex);
				this.modelToThreeLineMaterial.set (modelMaterialIndex, threeMaterial);
			}
			return this.modelToThreeLineMaterial.get (modelMaterialIndex);
		} else {
			return null;
		}
	}

	CreateThreeFaceMaterial (materialIndex)
	{
		let material = this.model.GetMaterial (materialIndex);
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

		if (this.conversionParams.forceMediumpForMaterials) {
			materialParams.precision = 'mediump';
		}

		let threeMaterial = null;
		if (this.shadingType === ShadingType.Phong) {
			threeMaterial = new THREE.MeshPhongMaterial (materialParams);
			if (material.type === MaterialType.Phong) {
				let specularColor = ConvertColorToThreeColor (material.specular);
				if (IsEqual (material.shininess, 0.0)) {
					specularColor.setRGB (0.0, 0.0, 0.0);
				}
				threeMaterial.specular = specularColor;
				threeMaterial.shininess = material.shininess * 100.0;
				this.LoadFaceTexture (threeMaterial, material.specularMap, (threeTexture) => {
					threeMaterial.specularMap = threeTexture;
				});
			}
		} else if (this.shadingType === ShadingType.Physical) {
			threeMaterial = new THREE.MeshStandardMaterial (materialParams);
			if (material.type === MaterialType.Physical) {
				threeMaterial.metalness = material.metalness;
				threeMaterial.roughness = material.roughness;
				this.LoadFaceTexture (threeMaterial, material.metalnessMap, (threeTexture) => {
					threeMaterial.metalness = 1.0;
					threeMaterial.roughness = 1.0;
					threeMaterial.metalnessMap = threeTexture;
					threeMaterial.roughnessMap = threeTexture;
				});
			}
		}

		let emissiveColor = ConvertColorToThreeColor (material.emissive);
		threeMaterial.emissive = emissiveColor;

		this.LoadFaceTexture (threeMaterial, material.diffuseMap, (threeTexture) => {
			if (!material.multiplyDiffuseMap) {
				threeMaterial.color.setRGB (1.0, 1.0, 1.0);
			}
			threeMaterial.map = threeTexture;
		});
		this.LoadFaceTexture (threeMaterial, material.bumpMap, (threeTexture) => {
			threeMaterial.bumpMap = threeTexture;
		});
		this.LoadFaceTexture (threeMaterial, material.normalMap, (threeTexture) => {
			threeMaterial.normalMap = threeTexture;
		});
		this.LoadFaceTexture (threeMaterial, material.emissiveMap, (threeTexture) => {
			threeMaterial.emissiveMap = threeTexture;
		});

		if (material.source !== MaterialSource.Model) {
			threeMaterial.userData.source = material.source;
			this.conversionOutput.defaultMaterials.push (threeMaterial);
		}

		return threeMaterial;
	}

	CreateThreeLineMaterial (materialIndex)
	{
		let material = this.model.GetMaterial (materialIndex);
		let baseColor = ConvertColorToThreeColor (material.color);
		let materialParams = {
			color : baseColor,
			opacity : material.opacity
		};

		if (this.conversionParams.forceMediumpForMaterials) {
			materialParams.precision = 'mediump';
		}

		let threeMaterial = new THREE.LineBasicMaterial (materialParams);
		if (material.source !== MaterialSource.Model) {
			threeMaterial.userData.source = material.source;
			this.conversionOutput.defaultMaterials.push (threeMaterial);
		}

		return threeMaterial;
	}

	LoadFaceTexture (threeMaterial, texture, onTextureLoaded)
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

		if (texture === null || !texture.IsValid ()) {
			return;
		}
		let loader = new THREE.TextureLoader ();
		this.stateHandler.OnTextureNeeded ();
		let textureObjectUrl = null;
		if (texture.mimeType !== null) {
			textureObjectUrl = CreateObjectUrlWithMimeType (texture.buffer, texture.mimeType);
		} else {
			textureObjectUrl = CreateObjectUrl (texture.buffer);
		}
		this.conversionOutput.objectUrls.push (textureObjectUrl);
		loader.load (textureObjectUrl,
			(threeTexture) => {
				SetTextureParameters (texture, threeTexture);
				threeMaterial.needsUpdate = true;
				onTextureLoaded (threeTexture);
				this.stateHandler.OnTextureLoaded ();
			},
			null,
			(err) => {
				this.stateHandler.OnTextureLoaded ();
			}
		);
	}
}

export class ThreeMeshMaterialHandler
{
	constructor (threeGeometry, geometryType, materialHandler)
	{
		this.threeGeometry = threeGeometry;
		this.geometryType = geometryType;
		this.materialHandler = materialHandler;

		this.itemVertexCount = null;
		if (geometryType === MaterialGeometryType.Face) {
			this.itemVertexCount = 3;
		} else if (geometryType === MaterialGeometryType.Line) {
			this.itemVertexCount = 2;
		}

		this.meshThreeMaterials = [];
		this.meshOriginalMaterials = [];

		this.groupStart = null;
		this.previousMaterialIndex = null;
	}

	ProcessItem (itemIndex, materialIndex)
	{
		if (this.previousMaterialIndex !== materialIndex) {
			if (this.groupStart !== null) {
				this.AddGroup (this.groupStart, itemIndex - 1);
			}
			this.groupStart = itemIndex;

			let threeMaterial = this.materialHandler.GetThreeMaterial (materialIndex, this.geometryType);
			this.meshThreeMaterials.push (threeMaterial);
			this.meshOriginalMaterials.push (materialIndex);

			this.previousMaterialIndex = materialIndex;
		}
	}

	Finalize (itemCount)
	{
		this.AddGroup (this.groupStart, itemCount - 1);
	}

	AddGroup (start, end)
	{
		let materialIndex = this.meshThreeMaterials.length - 1;
		this.threeGeometry.addGroup (start * this.itemVertexCount, (end - start + 1) * this.itemVertexCount, materialIndex);
	}
}

export function ConvertModelToThreeObject (model, conversionParams, conversionOutput, callbacks)
{
	function CreateThreeTriangleMesh (meshInstance, materialHandler)
	{
		let mesh = meshInstance.mesh;
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
		let meshMaterialHandler = new ThreeMeshMaterialHandler (threeGeometry, MaterialGeometryType.Face, materialHandler);

		let vertices = [];
		let vertexColors = [];
		let normals = [];
		let uvs = [];

		let meshHasVertexColors = (mesh.VertexColorCount () > 0);
		let meshHasUVs = (mesh.TextureUVCount () > 0);
		let processedTriangleCount = 0;
		for (let triangleIndex of triangleIndices) {
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

			meshMaterialHandler.ProcessItem (processedTriangleCount, triangle.mat);
			processedTriangleCount += 1;
		}
		meshMaterialHandler.Finalize (processedTriangleCount);

		threeGeometry.setAttribute ('position', new THREE.Float32BufferAttribute (vertices, 3));
		if (vertexColors.length !== 0) {
			threeGeometry.setAttribute ('color', new THREE.Float32BufferAttribute (vertexColors, 3));
		}
		threeGeometry.setAttribute ('normal', new THREE.Float32BufferAttribute (normals, 3));
		if (uvs.length !== 0) {
			threeGeometry.setAttribute ('uv', new THREE.Float32BufferAttribute (uvs, 2));
		}

		let threeMesh = new THREE.Mesh (threeGeometry, meshMaterialHandler.meshThreeMaterials);
		threeMesh.name = mesh.GetName ();
		threeMesh.userData = {
			originalMeshInstance : meshInstance,
			originalMaterials : meshMaterialHandler.meshOriginalMaterials,
			threeMaterials : null
		};

		return threeMesh;
	}

	function CreateThreeLineMesh (meshInstance, materialHandler)
	{
		let mesh = meshInstance.mesh;
		let lineCount = mesh.LineCount ();
		if (lineCount === 0) {
			return null;
		}

		let lineIndices = [];
		for (let i = 0; i < lineCount; i++) {
			lineIndices.push (i);
		}
		lineIndices.sort ((a, b) => {
			let aLine = mesh.GetLine (a);
			let bLine = mesh.GetLine (b);
			return aLine.mat - bLine.mat;
		});

		let threeGeometry = new THREE.BufferGeometry ();
		let meshMaterialHandler = new ThreeMeshMaterialHandler (threeGeometry, MaterialGeometryType.Line, materialHandler);

		let vertices = [];
		let segmentCount = 0;
		for (let i = 0; i < lineIndices.length; i++) {
			let line = mesh.GetLine (lineIndices[i]);
			let lineVertices = line.GetVertices ();
			for (let i = 0; i < lineVertices.length; i++) {
				let vertexIndex = lineVertices[i];
				let vertex = mesh.GetVertex (vertexIndex);
				vertices.push (vertex.x, vertex.y, vertex.z);
				if (i > 0 && i < lineVertices.length - 1) {
					vertices.push (vertex.x, vertex.y, vertex.z);
				}
			}
			meshMaterialHandler.ProcessItem (segmentCount, line.mat);
			segmentCount += line.SegmentCount ();
		}
		meshMaterialHandler.Finalize (segmentCount);

		threeGeometry.setAttribute ('position', new THREE.Float32BufferAttribute (vertices, 3));

		let threeLine = new THREE.LineSegments (threeGeometry, meshMaterialHandler.meshThreeMaterials);
		threeLine.userData = {
			originalMeshInstance : meshInstance,
			originalMaterials : meshMaterialHandler.meshOriginalMaterials,
			threeMaterials : null
		};
		return threeLine;
	}

	function ConvertMesh (threeObject, meshInstance, materialHandler)
	{
		if (IsEmptyMesh (meshInstance.mesh)) {
			return;
		}

		let triangleMesh = CreateThreeTriangleMesh (meshInstance, materialHandler);
		if (triangleMesh !== null) {
			threeObject.add (triangleMesh);
		}

		let lineMesh = CreateThreeLineMesh (meshInstance, materialHandler);
		if (lineMesh !== null) {
			threeObject.add (lineMesh);
		}
	}

	function ConvertNodeHierarchy (threeRootNode, model, materialHandler, stateHandler)
	{
		let nodeTree = new ThreeNodeTree (model, threeRootNode);
		let threeNodeItems = nodeTree.GetNodeItems ();

		RunTasksBatch (threeNodeItems.length, 100, {
			runTask : (firstMeshInstanceIndex, lastMeshInstanceIndex, onReady) => {
				for (let meshInstanceIndex = firstMeshInstanceIndex; meshInstanceIndex <= lastMeshInstanceIndex; meshInstanceIndex++) {
					let nodeItem = threeNodeItems[meshInstanceIndex];
					ConvertMesh (nodeItem.threeNode, nodeItem.meshInstance, materialHandler);
				}
				onReady ();
			},
			onReady : () => {
				stateHandler.OnModelLoaded (threeRootNode);
			}
		});
	}

	let stateHandler = new ThreeConversionStateHandler (callbacks);
	let materialHandler = new ThreeMaterialHandler (model, stateHandler, conversionParams, conversionOutput);
	let threeObject = new THREE.Object3D ();
	ConvertNodeHierarchy (threeObject, model, materialHandler, stateHandler);
}
