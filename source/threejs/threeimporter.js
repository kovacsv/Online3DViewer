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
            const loader = this.CreateLoader ();
            this.LoadModel (fileContent, loader, onFinish);    
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

    CreateLoader ()
    {
        const manager = new THREE.LoadingManager ();
        manager.setURLModifier ((url) => {
            if (url.startsWith ('data:') || url.startsWith ('blob:')) {
                return url;
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

    LoadModel (fileContent, loader, onFinish)
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

        // TODO: error handling
        const mainFileUrl = OV.CreateObjectUrl (fileContent);
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
                    if (child.matrixWorld !== undefined && child.matrixWorld !== null) {
                        const matrix = new OV.Matrix (child.matrixWorld.elements);
                        const transformation = new OV.Transformation (matrix);

                        // TODO: flip to transform mesh
                        let determinant = matrix.Determinant ();
                        let mirrorByX = OV.IsNegative (determinant);
                        if (mirrorByX) {
                            OV.FlipMeshTrianglesOrientation (mesh);
                        }
                        OV.TransformMesh (mesh, transformation);
                    }
                    // TODO: transform
                    this.model.AddMesh (mesh);
                }
            });
            onFinish ();
        });
    }
};
