import { WaitWhile } from '../core/taskrunner.js';
import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';
import { Base64DataURIToArrayBuffer, CreateObjectUrl, GetFileExtensionFromMimeType } from '../io/bufferutils.js';
import { GetFileExtension, GetFileName } from '../io/fileutils.js';
import { PhongMaterial, TextureMap } from '../model/material.js';
import { Node } from '../model/node.js';
import { ConvertThreeColorToColor, ConvertThreeGeometryToMesh, ThreeLinearToSRGBColorConverter, ThreeSRGBToLinearColorConverter } from '../threejs/threeutils.js';
import { ImporterBase } from './importerbase.js';

import * as THREE from 'three';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader.js';

export class ImporterThreeBase extends ImporterBase
{
    constructor ()
    {
        super ();

        this.colorConverter = null;
    }

    CreateLoader (manager)
    {
        return null;
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }

    IsMeshVisible (mesh)
    {
        return true;
    }

    ClearContent ()
    {
        this.loader = null;
        this.materialIdToIndex = null;
        this.objectUrlToFileName = null;
    }

    ResetContent ()
    {
        this.loader = null;
        this.materialIdToIndex = new Map ();
        this.objectUrlToFileName = new Map ();
    }

    ImportContent (fileContent, onFinish)
    {
        this.LoadModel (fileContent, onFinish);
    }

    LoadModel (fileContent, onFinish)
    {
        let isAllLoadersDone = false;
        let loadingManager = new THREE.LoadingManager (() => {
            isAllLoadersDone = true;
        });

        const mainFileUrl = CreateObjectUrl (fileContent);
        loadingManager.setURLModifier ((url) => {
            if (url === mainFileUrl) {
                return url;
            }
            const name = GetFileName (url);
            const extension = GetFileExtension (url);
            if (extension.length > 0) {
                const buffer = this.callbacks.getFileBuffer (url);
                if (buffer !== null) {
                    let objectUrl = CreateObjectUrl (buffer);
                    this.objectUrlToFileName.set (objectUrl, name);
                    return objectUrl;
                }
            }
            return url;
        });

        const threeLoader = this.CreateLoader (loadingManager);
        if (threeLoader === null) {
            onFinish ();
            return;
        }

        threeLoader.load (mainFileUrl,
            (object) => {
                WaitWhile (() => {
                    if (isAllLoadersDone) {
                        this.OnThreeObjectsLoaded (object, onFinish);
                        return false;
                    }
                    return true;
                });
            },
            () => {
            },
            (err) => {
                this.SetError (err);
                onFinish ();
            }
        );
    }

    OnThreeObjectsLoaded (loadedObject, onFinish)
    {
        function GetObjectTransformation (threeObject)
        {
            let matrix = new Matrix ().CreateIdentity ();
            threeObject.updateMatrix ();
            if (threeObject.matrix !== undefined && threeObject.matrix !== null) {
                matrix.Set (threeObject.matrix.elements);
            }
            return new Transformation (matrix);
        }

        function AddObject (importer, model, threeObject, parentNode)
        {
            let node = new Node ();
            if (threeObject.name !== undefined) {
                node.SetName (threeObject.name);
            }
            node.SetTransformation (GetObjectTransformation (threeObject));
            parentNode.AddChildNode (node);

            for (let childObject of threeObject.children) {
                AddObject (importer, model, childObject, node);
            }
            if (threeObject.isMesh && importer.IsMeshVisible (threeObject)) {
                let mesh = importer.ConvertThreeMesh (threeObject);
                let meshIndex = model.AddMesh (mesh);
                node.AddMeshIndex (meshIndex);
            }
        }

        let mainObject = this.GetMainObject (loadedObject);
        let rootNode = this.model.GetRootNode ();
        rootNode.SetTransformation (GetObjectTransformation (mainObject));
        for (let childObject of mainObject.children) {
            AddObject (this, this.model, childObject, rootNode);
        }

        onFinish ();
    }

    ConvertThreeMesh (threeMesh)
    {
        let mesh = null;
        if (Array.isArray (threeMesh.material)) {
            mesh = ConvertThreeGeometryToMesh (threeMesh.geometry, null, this.colorConverter);
            if (threeMesh.geometry.attributes.color === undefined || threeMesh.geometry.attributes.color === null) {
                let materialIndices = [];
                for (let i = 0; i < threeMesh.material.length; i++) {
                    const material = threeMesh.material[i];
                    const materialIndex = this.FindOrCreateMaterial (material);
                    materialIndices.push (materialIndex);
                }
                for (let i = 0; i < threeMesh.geometry.groups.length; i++) {
                    let group = threeMesh.geometry.groups[i];
                    let groupEnd = null;
                    if (group.count === Infinity) {
                        groupEnd = mesh.TriangleCount ();
                    } else {
                        groupEnd = group.start / 3 + group.count / 3;
                    }
                    for (let j = group.start / 3; j < groupEnd; j++) {
                        let triangle = mesh.GetTriangle (j);
                        triangle.SetMaterial (materialIndices[group.materialIndex]);
                    }
                }
            }
        } else {
            const materialIndex = this.FindOrCreateMaterial (threeMesh.material);
            mesh = ConvertThreeGeometryToMesh (threeMesh.geometry, materialIndex, this.colorConverter);
        }
        if (threeMesh.name !== undefined && threeMesh.name !== null) {
            mesh.SetName (threeMesh.name);
        }
        return mesh;
    }

    FindOrCreateMaterial (threeMaterial)
    {
        if (this.materialIdToIndex.has (threeMaterial.id)) {
            return this.materialIdToIndex.get (threeMaterial.id);
        }
        let material = this.ConvertThreeMaterial (threeMaterial);
        let materialIndex = null;
        if (material !== null) {
            materialIndex = this.model.AddMaterial (material);
        }
        this.materialIdToIndex.set (threeMaterial.id, materialIndex);
        return materialIndex;
    }

    ConvertThreeMaterial (threeMaterial)
    {
        function CreateTexture (threeMap, objectUrlToFileName)
        {
            function GetDataUrl (img)
            {
                if (img.data !== undefined && img.data !== null) {
                    let imageData = new ImageData (img.width, img.height);
                    let imageSize = img.width * img.height * 4;
                    for (let i = 0; i < imageSize; i++) {
                        imageData.data[i] = img.data[i];
                    }
                    return THREE.ImageUtils.getDataURL (imageData);
                } else {
                    return THREE.ImageUtils.getDataURL (img);
                }
            }

            if (threeMap === undefined || threeMap === null) {
                return null;
            }

            if (threeMap.image === undefined || threeMap.image === null) {
                return null;
            }

            try {
                const dataUrl = GetDataUrl (threeMap.image);
                const base64Buffer = Base64DataURIToArrayBuffer (dataUrl);
                let texture = new TextureMap ();
                let textureName = null;
                if (objectUrlToFileName.has (threeMap.image.src)) {
                    textureName = objectUrlToFileName.get (threeMap.image.src);
                } else if (threeMap.name !== undefined && threeMap.name !== null) {
                    textureName = threeMap.name + '.' + GetFileExtensionFromMimeType (base64Buffer.mimeType);
                } else {
                    textureName = 'Embedded_' + threeMap.id.toString () + '.' + GetFileExtensionFromMimeType (base64Buffer.mimeType);
                }
                texture.name = textureName;
                texture.mimeType = base64Buffer.mimeType;
                texture.buffer = base64Buffer.buffer;
                texture.rotation = threeMap.rotation;
                texture.offset.x = threeMap.offset.x;
                texture.offset.y = threeMap.offset.y;
                texture.scale.x = threeMap.repeat.x;
                texture.scale.y = threeMap.repeat.y;
                return texture;
            } catch (err) {
                return null;
            }
        }

        if (threeMaterial.name === THREE.Loader.DEFAULT_MATERIAL_NAME) {
            return null;
        }

        let material = new PhongMaterial ();
        material.name = threeMaterial.name;
        material.color = this.ConvertThreeColor (threeMaterial.color);
        material.opacity = threeMaterial.opacity;
        material.transparent = threeMaterial.transparent;
        material.alphaTest = threeMaterial.alphaTest;
        if (threeMaterial.type === 'MeshPhongMaterial') {
            material.specular = this.ConvertThreeColor (threeMaterial.specular);
            material.shininess = threeMaterial.shininess / 100.0;
        }
        material.diffuseMap = CreateTexture (threeMaterial.map, this.objectUrlToFileName);
        material.normalMap = CreateTexture (threeMaterial.normalMap, this.objectUrlToFileName);
        material.bumpMap = CreateTexture (threeMaterial.bumpMap, this.objectUrlToFileName);

        return material;
    }

    ConvertThreeColor (threeColor)
    {
        if (this.colorConverter !== null) {
            threeColor = this.colorConverter.Convert (threeColor);
        }
        return ConvertThreeColorToColor (threeColor);
    }
}

export class ImporterThreeFbx extends ImporterThreeBase
{
    constructor ()
    {
        super ();
        this.colorConverter = new ThreeLinearToSRGBColorConverter ();
    }

    CanImportExtension (extension)
    {
        return extension === 'fbx';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    CreateLoader (manager)
    {
        manager.addHandler (/\.tga$/i, new TGALoader (manager));
        return new FBXLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }
}

export class ImporterThreeDae extends ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'dae';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    CreateLoader (manager)
    {
        manager.addHandler (/\.tga$/i, new TGALoader (manager));
        return new ColladaLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject.scene;
    }
}

export class ImporterThreeWrl extends ImporterThreeBase
{
    constructor ()
    {
        super ();
        this.colorConverter = new ThreeLinearToSRGBColorConverter ();
    }

    CanImportExtension (extension)
    {
        return extension === 'wrl';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    CreateLoader (manager)
    {
        return new VRMLLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }

    IsMeshVisible (mesh)
    {
        let isVisible = true;
        if (Array.isArray (mesh.material)) {
            for (let i = 0; i < mesh.material.length; i++) {
                if (mesh.material[i].side === THREE.BackSide) {
                    isVisible = false;
                    break;
                }
            }
        } else {
            isVisible = (mesh.material.side !== THREE.BackSide);
        }
        return isVisible;
    }
}

export class ImporterThree3mf extends ImporterThreeBase
{
    constructor ()
    {
        super ();
        this.colorConverter = new ThreeSRGBToLinearColorConverter ();
    }

    CanImportExtension (extension)
    {
        return extension === '3mf';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    CreateLoader (manager)
    {
        return new ThreeMFLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }
}

export class ImporterThreeAmf extends ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'amf';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    CreateLoader (manager)
    {
        return new AMFLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }
}
