OV.ImporterThreeBase = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }

    GetExternalLibraries ()
    {
        return null;
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
        async function LoadLibraries (libraries, onFinish, onError)
        {
            try {
                for (let i = 0; i < libraries.length; i++) {
                    await OV.LoadExternalLibrary (libraries[i]);
                }
            } catch (err) {
                onError ();
            }
            onFinish ();
        }

        const libraries = this.GetExternalLibraries ();
        if (libraries === null) {
            onFinish ();
            return;
        }

        LoadLibraries (libraries, () => {
            this.LoadModel (fileContent, onFinish);
        }, () => {
            onFinish ();
        });
    }

    LoadModel (fileContent, onFinish)
    {
        let loadedObject = null;
        let loadingManager = new THREE.LoadingManager (() => {
            if (loadedObject !== null) {
                this.OnThreeObjectsLoaded (loadedObject, onFinish);
            }
        });

        const mainFileUrl = OV.CreateObjectUrl (fileContent);
        loadingManager.setURLModifier ((url) => {
            if (url === mainFileUrl) {
                return url;
            }
            const name = OV.GetFileName (url);
            const extension = OV.GetFileExtension (url);
            if (extension.length > 0) {
                const buffer = this.callbacks.getFileBuffer (url);
                if (buffer !== null) {
                    let objectUrl = OV.CreateObjectUrl (buffer);
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
                loadedObject = object;
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
            let matrix = new OV.Matrix ().CreateIdentity ();
            threeObject.updateMatrix ();
            if (threeObject.matrix !== undefined && threeObject.matrix !== null) {
                matrix.Set (threeObject.matrix.elements);
            }
            return new OV.Transformation (matrix);
        }

        function AddObject (importer, model, threeObject, parentNode)
        {
            let node = new OV.Node ();
            if (threeObject.name !== undefined) {
                node.SetName (threeObject.name);
            }
            node.SetTransformation (GetObjectTransformation (threeObject));
            parentNode.AddChildNode (node);

            for (let childObject of threeObject.children) {
                AddObject (importer, model, childObject, node);
            }
            if (threeObject.isMesh && importer.IsMeshVisible (threeObject)) {
                if (threeObject.children.length === 0) {
                    node.SetType (OV.NodeType.MeshNode);
                }
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
            mesh = OV.ConvertThreeGeometryToMesh (threeMesh.geometry, null);
            if (threeMesh.geometry.attributes.color === undefined || threeMesh.geometry.attributes.color === null) {
                let materialIndices = [];
                for (let i = 0; i < threeMesh.material.length; i++) {
                    const material = threeMesh.material[i];
                    const materialIndex = this.FindOrCreateMaterial (material);
                    materialIndices.push (materialIndex);
                }
                for (let i = 0; i < threeMesh.geometry.groups.length; i++) {
                    let group = threeMesh.geometry.groups[i];
                    for (let j = group.start / 3; j < group.start / 3 + group.count / 3; j++) {
                        let triangle = mesh.GetTriangle (j);
                        triangle.SetMaterial (materialIndices[group.materialIndex]);
                    }
                }
            }
        } else {
            const materialIndex = this.FindOrCreateMaterial (threeMesh.material);
            mesh = OV.ConvertThreeGeometryToMesh (threeMesh.geometry, materialIndex);
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
        let materialIndex = this.model.AddMaterial (material);
        this.materialIdToIndex.set (threeMaterial.id, materialIndex);
        return materialIndex;
    }

    ConvertThreeMaterial (threeMaterial)
    {
        function SetColor (color, threeColor)
        {
            color.Set (
                parseInt (threeColor.r * 255.0, 10),
                parseInt (threeColor.g * 255.0, 10),
                parseInt (threeColor.b * 255.0, 10)
            );
        }

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
                const base64Buffer = OV.Base64DataURIToArrayBuffer (dataUrl);
                let texture = new OV.TextureMap ();
                let textureName = null;
                if (objectUrlToFileName.has (threeMap.image.src)) {
                    textureName = objectUrlToFileName.get (threeMap.image.src);
                } else if (threeMap.name !== undefined && threeMap.name !== null) {
                    textureName = threeMap.name + '.' + OV.GetFileExtensionFromMimeType (base64Buffer.mimeType);
                } else {
                    textureName = 'Embedded_' + threeMap.id.toString () + '.' + OV.GetFileExtensionFromMimeType (base64Buffer.mimeType);
                }
                texture.name = textureName;
                texture.url = dataUrl;
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

        let material = new OV.Material (OV.MaterialType.Phong);
        material.name = threeMaterial.name;
        SetColor (material.color, threeMaterial.color);
        material.opacity = threeMaterial.opacity;
        material.transparent = threeMaterial.transparent;
        material.alphaTest = threeMaterial.alphaTest;
        if (threeMaterial.type === 'MeshPhongMaterial') {
            SetColor (material.specular, threeMaterial.specular);
            material.shininess = threeMaterial.shininess / 100.0;
        }
        material.diffuseMap = CreateTexture (threeMaterial.map, this.objectUrlToFileName);
        material.normalMap = CreateTexture (threeMaterial.normalMap, this.objectUrlToFileName);
        material.bumpMap = CreateTexture (threeMaterial.bumpMap, this.objectUrlToFileName);

        return material;
    }
};

OV.ImporterThreeFbx = class extends OV.ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'fbx';
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }

    GetExternalLibraries ()
    {
        return [
            'loaders/fflate.min.js',
            'three_loaders/TGALoader.js',
            'three_loaders/FBXLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        manager.addHandler (/\.tga$/i, new THREE.TGALoader (manager));
        return new THREE.FBXLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }
};

OV.ImporterThreeDae = class extends OV.ImporterThreeBase
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
        return OV.Direction.Y;
    }

    GetExternalLibraries ()
    {
        return [
            'three_loaders/TGALoader.js',
            'three_loaders/ColladaLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        manager.addHandler (/\.tga$/i, new THREE.TGALoader (manager));
        return new THREE.ColladaLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject.scene;
    }
};

OV.ImporterThreeWrl = class extends OV.ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'wrl';
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }

    GetExternalLibraries ()
    {
        return [
            'three_loaders/chevrotain.min.js',
            'three_loaders/VRMLLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        return new THREE.VRMLLoader (manager);
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
};

OV.ImporterThree3mf = class extends OV.ImporterThreeBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === '3mf';
    }

    GetUpDirection ()
    {
        return OV.Direction.Z;
    }

    GetExternalLibraries ()
    {
        return [
            'loaders/fflate.min.js',
            'three_loaders/3MFLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        return new THREE.ThreeMFLoader (manager);
    }

    GetMainObject (loadedObject)
    {
        return loadedObject;
    }
};
