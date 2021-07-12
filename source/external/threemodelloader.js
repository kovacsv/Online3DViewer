OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
        this.importer.AddImporter (new OV.Importer3dm ());
        this.importer.AddImporter (new OV.ImporterIfc ());
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

    ReloadFiles (settings)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.OnFilesLoaded (settings);        
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
        let result = new OV.ModelToThreeConversionResult ();
        OV.ConvertModelToThreeMeshes (importResult.model, params, result, {
            onTextureLoaded : () => {
                this.callbacks.onTextureLoaded ();
            },
            onModelLoaded : (meshes) => {
                this.defaultMaterial = result.defaultMaterial;
                this.callbacks.onModelFinished (importResult, meshes);
                this.inProgress = false;
            }
        });
    }

    GetImporter ()
    {
        return this.importer;
    }
};
