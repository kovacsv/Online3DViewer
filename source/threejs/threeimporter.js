OV.ThreeImporter = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        const knownExtensions = ['fbx'];
        return knownExtensions.indexOf (extension) !== -1;
    }

    GetKnownFileFormats ()
    {
        return {
            'fbx' : OV.FileFormat.Binary
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.Y;
    }    
    
    ClearContent ()
    {
        if (this.loadedScene !== undefined && this.loadedScene !== null) {
            this.loadedScene.traverse ((child) => {
                if (child.isMesh) {
                    child.geometry.dispose ();
                }
            });
            this.loadedScene = null;
        }
    }

    ResetContent ()
    {
        this.loadedScene = null;
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

    GetExternalLibraries ()
    {
        let libraries = [
            'three_loaders/TGALoader.js'
        ];
        if (this.extension === 'fbx') {
            libraries.push (
                'three_loaders/fflate.min.js',
                'three_loaders/FBXLoader.js'
            );
        } else {
            return null;
        }
        return libraries;
    }

    CreateLoader (manager)
    {
        let loader = null;
        if (this.extension === 'fbx') {
            loader = new THREE.FBXLoader (manager);
        }
        return loader;
    }

    LoadModel (fileContent, onFinish)
    {
        let loadedScene = null;
        let externalFileNames = {};
        let loadingManager = new THREE.LoadingManager (() => {
            if (loadedScene !== null) {
                this.OnThreeObjectsLoaded (loadedScene, externalFileNames, onFinish);
            }
        });
        // TODO
        loadingManager.addHandler (/\.tga$/i, new THREE.TGALoader (loadingManager));

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

        const loader = this.CreateLoader (loadingManager);
        if (loader === null) {
            onFinish ();
            return;
        }

        loader.load (mainFileUrl,
            (object) => {
                loadedScene = object;
            },
            () => {
            },
            (err) => {
                this.SetError ();
                this.SetMessage (err);
                onFinish ();
            }
        );
    }

    OnThreeObjectsLoaded (loadedScene, externalFileNames, onFinish)
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
                    // TODO: texture offset, rotation, scale
                    return texture;
                } catch (err) {
                    return null;
                }
            }
        
            // TODO: PBR materials
            // TODO: other material properties
            let material = new OV.Material (OV.MaterialType.Phong);
            material.name = threeMaterial.name;
            SetColor (material.color, threeMaterial.color);
            material.opacity = threeMaterial.opacity;
            material.transparent = threeMaterial.transparent;
            material.alphaTest = threeMaterial.alphaTest;
            if (threeMaterial.type === 'MeshPhongMaterial') {
                SetColor (material.specular, threeMaterial.specular);
                // TODO:
                //SetColor (material.emissive, threeMaterial.emissive);
                material.shininess = threeMaterial.shininess / 100.0;
            }
            if (threeMaterial.map !== undefined && threeMaterial.map !== null) {
                material.diffuseMap = CreateTexture (threeMaterial.map, externalFileNames);
            }
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
        this.loadedScene = loadedScene;
        loadedScene.traverse ((child) => {
            if (child.isMesh) {
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
            }
        });
        onFinish ();
    }
};
