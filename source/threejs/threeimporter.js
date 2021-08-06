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
        return OV.Direction.Z;
    }    
    
    ClearContent ()
    {

    }

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {
        const libraries = this.GetExternalLibraries ();
        if (libraries === null) {
            onFinish ();
            return;
        }
        Promise.all (libraries).then (() => {
            const mainFileUrl = OV.CreateObjectUrl (fileContent);
            const loader = this.CreateLoader (mainFileUrl);
            this.LoadModel (mainFileUrl, loader, onFinish);    
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

    CreateLoader (mainFileUrl)
    {
        const manager = new THREE.LoadingManager ();
        manager.setURLModifier ((url) => {
            if (url === mainFileUrl) {
                return mainFileUrl;
            }
            const fileBuffer = this.callbacks.getFileBuffer (url);
            const fileUrl = OV.CreateObjectUrl (fileBuffer);
            return fileUrl;
        });
        let loader = null;
        if (this.extension === 'fbx') {
            loader = new THREE.FBXLoader (manager);
        }        
        return loader;
    }

    LoadModel (mainFileUrl, loader, onFinish)
    {
        function SetColor (color, threeColor)
        {
            color.Set (
                parseInt (threeColor.r * 255.0, 10),
                parseInt (threeColor.g * 255.0, 10),
                parseInt (threeColor.b * 255.0, 10)
            );
        }

        if (loader === null) {
            onFinish ();
            return;
        }

        // TODO: error
        loader.load (mainFileUrl, (object) => {
            object.traverse ((child) => {
                if (child.isMesh) {
                    // TODO: merge same materials
                    // TODO: PBR materials
                    console.log (child);
                    let threeMaterial = child.material;
                    let material = new OV.Material (OV.MaterialType.Phong);
                    material.name = threeMaterial.name;
                    SetColor (material.color, threeMaterial.color);
                    if (threeMaterial.type === 'MeshPhongMaterial') {
                        SetColor (material.specular, threeMaterial.specular);
                        material.shininess = threeMaterial.shininess / 100.0;
                    }
                    const materialIndex = this.model.AddMaterial (material);
                    let mesh = OV.ConvertThreeGeometryToMesh (child.geometry, materialIndex);
                    this.model.AddMesh (mesh);
                }
            });
            onFinish ();
        });
    }
};
