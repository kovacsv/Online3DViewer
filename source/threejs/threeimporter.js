OV.ThreeImporter = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'fbx';
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
        const libraries = this.GetExternalLibraries ();
        if (libraries === null) {
            onFinish ();
            return;
        }
        Promise.all (libraries).then (() => {
            this.LoadModel (fileContent, onFinish);    
        }).catch (() => {
            onFinish ();
        });
    }

    GetExternalLibraries ()
    {
        if (this.extension === 'fbx') {
            return [
                OV.LoadExternalLibrary ('three_loaders/FBXLoader.js'),
                OV.LoadExternalLibrary ('three_loaders/fflate.min.js')
            ];
        }
        return null;
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
        let textureNames = {};
        let loadingManager = new THREE.LoadingManager (() => {
            if (loadedScene !== null) {
                this.OnThreeObjectsLoaded (loadedScene, textureNames, onFinish);
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
                        textureNames[objectUrl] = name;
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

    OnThreeObjectsLoaded (loadedScene, textureNames, onFinish)
    {
        function ConvertThreeMaterialToMaterial (threeMaterial, textureNames)
        {
            function SetColor (color, threeColor)
            {
                color.Set (
                    parseInt (threeColor.r * 255.0, 10),
                    parseInt (threeColor.g * 255.0, 10),
                    parseInt (threeColor.b * 255.0, 10)
                );
            }
        
            function CreateTexture (threeMap, textureNames)
            {
                if (threeMap.image === undefined || threeMap.image === null) {
                    return null;
                }
                const dataUrl = THREE.ImageUtils.getDataURL (threeMap.image);
                const base64Buffer = OV.Base64DataURIToArrayBuffer (dataUrl);
                let texture = new OV.TextureMap ();
                let textureName = textureNames[threeMap.image.src];
                if (textureName === undefined) {
                    textureName = 'Embedded_' + threeMap.id.toString () + '.' + OV.GetFileExtensionFromMimeType (base64Buffer.mimeType);
                }
                texture.name = textureName;
                texture.url = threeMap.image.src;
                texture.buffer = base64Buffer.buffer;
                return texture;
            }
        
            // TODO: PBR materials
            let material = new OV.Material (OV.MaterialType.Phong);
            material.name = threeMaterial.name;
            SetColor (material.color, threeMaterial.color);
            if (threeMaterial.type === 'MeshPhongMaterial') {
                SetColor (material.specular, threeMaterial.specular);
                material.shininess = threeMaterial.shininess / 100.0;
            }
            if (threeMaterial.map !== undefined && threeMaterial.map !== null) {
                material.diffuseMap = CreateTexture (threeMaterial.map, textureNames);
            }
            return material;
        }

        function FindMatchingMaterialIndex (model, threeMaterial, materialIdToIndex, textureNames)
        {
            let index = materialIdToIndex[threeMaterial.id];
            if (index !== undefined) {
                return index;
            }
            let material = ConvertThreeMaterialToMaterial (threeMaterial, textureNames);
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
                            materialIndices.push (FindMatchingMaterialIndex (this.model, child.material[i], materialIdToIndex, textureNames));
                        }
                        for (let i = 0; i < child.geometry.groups.length; i++) {
                            let group = child.geometry.groups[i];
                            console.log (group);
                            for (let j = group.start; j < group.start + group.count; j++) {
                                console.log (j);
                                let triangle = mesh.GetTriangle (j);
                                triangle.SetMaterial (materialIndices[group.materialIndex]);
                            }
                        }
                    }
                } else {
                    materialIndex = FindMatchingMaterialIndex (this.model, child.material, materialIdToIndex, textureNames);
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
