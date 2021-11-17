OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
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
        this.LoadFromSource (urls, OV.FileSource.Url, settings);
    }

    LoadFromFileList (files, settings)
    {
        this.LoadFromSource (files, OV.FileSource.File, settings);
    }

    LoadFromSource (files, fileSource, settings)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.callbacks.onLoadStart ();
        this.importer.ImportFiles (files, fileSource, settings, {
            onFilesLoaded : () => {
                this.callbacks.onImportStart ();
            },
            onImportSuccess : (importResult) => {
                this.OnModelImported (importResult);
            },
            onImportError : (importError) => {
                this.callbacks.onLoadError (importError);
                this.inProgress = false;
            }
        });
    }

    OnModelImported (importResult)
    {
        this.callbacks.onVisualizationStart ();
        let params = new OV.ModelToThreeConversionParams ();
        params.forceMediumpForMaterials = this.hasHighpDriverIssue;
        let output = new OV.ModelToThreeConversionOutput ();
        OV.ConvertModelToThreeObject (importResult.model, params, output, {
            onTextureLoaded : () => {
                this.callbacks.onTextureLoaded ();
            },
            onModelLoaded : (threeObject) => {
                this.defaultMaterial = output.defaultMaterial;
                this.callbacks.onModelFinished (importResult, threeObject);
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
