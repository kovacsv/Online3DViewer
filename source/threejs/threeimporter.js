OV.ThreeLoader = class
{
    constructor ()
    {

    }

    GetExtension ()
    {
        return null;
    }

    GetExternalLibraries ()
    {
        return null;
    }

    CreateLoader (manager)
    {
        return null;
    }

    EnumerateMeshes (loadedObject, processor)
    {
        
    }

    GetUpDirection ()
    {
        return null;
    }
};

OV.ThreeLoaderFbx = class extends OV.ThreeLoader
{
    constructor ()
    {
        super ();
    }

    GetExtension ()
    {
        return 'fbx';
    }

    GetExternalLibraries ()
    {
        return [
            'three_loaders/fflate.min.js',
            'three_loaders/TGALoader.js',
            'three_loaders/FBXLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        manager.addHandler (/\.tga$/i, new THREE.TGALoader (manager));
        return new THREE.FBXLoader (manager);
    }

    EnumerateMeshes (loadedObject, processor)
    {
        loadedObject.traverse ((child) => {
            if (child.isMesh) {
                processor (child);
            }
        });
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
};

OV.ThreeLoaderDae = class extends OV.ThreeLoader
{
    constructor ()
    {
        super ();
    }

    GetExtension ()
    {
        return 'dae';
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

    EnumerateMeshes (loadedObject, processor)
    {
        loadedObject.scene.traverse ((child) => {
            if (child.isMesh) {
                processor (child);
            }
        });
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
};

OV.ThreeLoaderVrml = class extends OV.ThreeLoader
{
    constructor ()
    {
        super ();
    }

    GetExtension ()
    {
        return 'wrl';
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

    EnumerateMeshes (loadedObject, processor)
    {
        loadedObject.traverse ((child) => {
            if (child.isMesh) {
                let needToProcess = true;
                if (Array.isArray (child.material)) {
                    for (let i = 0; i < child.material.length; i++) {
                        if (child.material[i].side === THREE.BackSide) {
                            needToProcess = false;
                            break;
                        }
                    }
                } else {
                    needToProcess = (child.material.side !== THREE.BackSide);
                }
                if (needToProcess) {
                    processor (child);
                }
            }
        });
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
};

OV.ThreeLoader3mf = class extends OV.ThreeLoader
{
    constructor ()
    {
        super ();
    }

    GetExtension ()
    {
        return '3mf';
    }

    GetExternalLibraries ()
    {
        return [
            'three_loaders/fflate.min.js',
            'three_loaders/3MFLoader.js'
        ];
    }

    CreateLoader (manager)
    {
        return new THREE.ThreeMFLoader (manager);
    }

    EnumerateMeshes (loadedObject, processor)
    {
        loadedObject.traverse ((child) => {
            if (child.isMesh) {
                processor (child);
            }
        });
    }

    GetUpDirection ()
    {
        return OV.Direction.Z;
    }
};

OV.ThreeImporter = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
        this.loaders = [
            new OV.ThreeLoaderFbx (),
            new OV.ThreeLoaderDae (),
            new OV.ThreeLoaderVrml (),
            new OV.ThreeLoader3mf ()
        ];
    }

    CanImportExtension (extension)
    {
        for (let i = 0; i < this.loaders.length; i++)  {
            let loader = this.loaders[i];
            if (loader.GetExtension () === extension) {
                return true;
            }
        }
        return false;
    }

    GetKnownFileFormats ()
    {
        let result = {};
        for (let i = 0; i < this.loaders.length; i++)  {
            let loader = this.loaders[i];
            result[loader.GetExtension ()] = OV.FileFormat.Binary;
        }
        return result;
    }
    
    GetUpDirection ()
    {
        return this.loader.GetUpDirection ();
    }    
    
    ClearContent ()
    {
        this.loader = null;
    }

    ResetContent ()
    {
        this.loader = null;
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

        this.loader = this.FindLoader ();
        if (this.loader === null) {
            onFinish ();
            return;
        }
        
        const libraries = this.loader.GetExternalLibraries ();
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

    FindLoader ()
    {
        for (let i = 0; i < this.loaders.length; i++)  {
            let loader = this.loaders[i];
            if (loader.GetExtension () === this.extension) {
                return loader;
            }
        }
        return null;
    }

    LoadModel (fileContent, onFinish)
    {
        let loadedObject = null;
        let externalFileNames = {};
        let loadingManager = new THREE.LoadingManager (() => {
            if (loadedObject !== null) {
                this.OnThreeObjectsLoaded (loadedObject, externalFileNames, onFinish);
            }
        });

        const mainFileUrl = OV.CreateObjectUrl (fileContent);
        loadingManager.setURLModifier ((url) => {
            if (url === mainFileUrl) {
                return url;
            }
            if (url.startsWith ('blob:')) {
                const name = OV.GetFileName (url);
                const extension = OV.GetFileExtension (url);
                if (extension.length > 0) {
                    const buffer = this.callbacks.getFileBuffer (url);
                    if (buffer !== null) {
                        let objectUrl = OV.CreateObjectUrl (buffer);
                        externalFileNames[objectUrl] = name;
                        return objectUrl;
                    }
                }
            }
            return url;
        });

        const threeLoader = this.loader.CreateLoader (loadingManager);
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

    OnThreeObjectsLoaded (loadedObject, externalFileNames, onFinish)
    {
        function ConvertThreeMaterialToMaterial (threeMaterial, externalFileNames)
        {
            function SetColor (color, threeColor)
            {
                color.Set (
                    parseInt (threeColor.r * 255.0, 10),
                    parseInt (threeColor.g * 255.0, 10),
                    parseInt (threeColor.b * 255.0, 10)
                );
            }
        
            function CreateTexture (threeMap, externalFileNames)
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
                        return THREE.ImageUtils.getDataURL (threeMap.image);
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
                    let textureName = externalFileNames[threeMap.image.src];
                    if (textureName === undefined) {
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
            material.diffuseMap = CreateTexture (threeMaterial.map, externalFileNames);
            material.normalMap = CreateTexture (threeMaterial.normalMap, externalFileNames);
            material.bumpMap = CreateTexture (threeMaterial.bumpMap, externalFileNames);

            return material;
        }

        function FindMatchingMaterialIndex (model, threeMaterial, materialIdToIndex, externalFileNames)
        {
            let index = materialIdToIndex[threeMaterial.id];
            if (index !== undefined) {
                return index;
            }
            let material = ConvertThreeMaterialToMaterial (threeMaterial, externalFileNames);
            index = model.AddMaterial (material);
            materialIdToIndex[threeMaterial.id] = index;
            return index;
        }

        let materialIdToIndex = {};
        this.loader.EnumerateMeshes (loadedObject, (child) => {
            let materialIndex = null;
            let mesh = null;
            if (Array.isArray (child.material)) {
                mesh = OV.ConvertThreeGeometryToMesh (child.geometry, null);
                if (child.geometry.attributes.color === undefined || child.geometry.attributes.color === null) {
                    let materialIndices = [];
                    for (let i = 0; i < child.material.length; i++) {
                        let material = child.material[i];
                        materialIndices.push (FindMatchingMaterialIndex (this.model, material, materialIdToIndex, externalFileNames));
                    }
                    for (let i = 0; i < child.geometry.groups.length; i++) {
                        let group = child.geometry.groups[i];
                        for (let j = group.start / 3; j < group.start / 3 + group.count / 3; j++) {
                            let triangle = mesh.GetTriangle (j);
                            triangle.SetMaterial (materialIndices[group.materialIndex]);
                        }
                    }
                }
            } else {
                materialIndex = FindMatchingMaterialIndex (this.model, child.material, materialIdToIndex, externalFileNames);
                mesh = OV.ConvertThreeGeometryToMesh (child.geometry, materialIndex);
            }
            if (child.name !== undefined && child.name !== null) {
                mesh.SetName (child.name);
            }
            child.updateWorldMatrix (true, true);
            if (child.matrixWorld !== undefined && child.matrixWorld !== null) {
                const matrix = new OV.Matrix (child.matrixWorld.elements);
                const transformation = new OV.Transformation (matrix);
                const determinant = matrix.Determinant ();
                const mirrorByX = OV.IsNegative (determinant);
                OV.TransformMesh (mesh, transformation);
                if (mirrorByX) {
                    OV.FlipMeshTrianglesOrientation (mesh);
                }
            }
            this.model.AddMesh (mesh);
            child.geometry.dispose ();
        });

        onFinish ();
    }
};
