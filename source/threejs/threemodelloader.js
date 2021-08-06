OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
        this.importer.AddImporter (new OV.ThreeImporter ());
        this.callbacks = null;
        this.inProgress = false;
        this.defaultMaterial = null;
        this.hasHighpDriverIssue = OV.HasHighpDriverIssue ();
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    LoadFromUrlList (urls, settings)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.importer.LoadFilesFromUrls (urls, () => {
            this.OnFilesLoaded (settings);
        });
    }
    
    LoadFromFileList (files, settings)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.importer.LoadFilesFromFileObjects (files, () => {
            this.OnFilesLoaded (settings);
        });
    }
    
    OnFilesLoaded (settings)
    {
        this.callbacks.onImportStart ();
        OV.RunTaskAsync (() => {
            this.importer.Import (settings, {
                onSuccess : (importResult) => {
                    this.OnModelImported (importResult);
                },
                onError : (importError) => {
                    this.callbacks.onLoadError (importError);
                    this.inProgress = false;
                }
            });
        });
    }

    OnModelImported (importResult)
    {
        this.callbacks.onVisualizationStart ();
        let params = new OV.ModelToThreeConversionParams ();
        params.forceMediumpForMaterials = this.hasHighpDriverIssue;
        let output = new OV.ModelToThreeConversionOutput ();
        OV.ConvertModelToThreeMeshes (importResult.model, params, output, {
            onTextureLoaded : () => {
                this.callbacks.onTextureLoaded ();
            },
            onModelLoaded : (meshes) => {
                this.defaultMaterial = output.defaultMaterial;
                this.callbacks.onModelFinished (importResult, meshes);
                this.inProgress = false;
            }
        });
    }

    GetImporter ()
    {
        return this.importer;
    }

    ReplaceDefaultMaterialColor (defaultColor)
    {
        if (this.defaultMaterial !== null) {
            this.defaultMaterial.color = new THREE.Color (defaultColor.r / 255.0, defaultColor.g / 255.0, defaultColor.b / 255.0);
        }
    }
};
