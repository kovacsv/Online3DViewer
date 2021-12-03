OV.ThreeModelLoader = class
{
    constructor ()
    {
        this.importer = new OV.Importer ();
        this.inProgress = false;
        this.defaultMaterial = null;
        this.hasHighpDriverIssue = OV.HasHighpDriverIssue ();
    }

    InProgress ()
    {
        return this.inProgress;
    }

    LoadModel (files, fileSource, settings, callbacks)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        callbacks.onLoadStart ();
        this.importer.ImportFiles (files, fileSource, settings, {
            onFilesLoaded : () => {
                callbacks.onImportStart ();
            },
            onSelectMainFile : (fileNames, selectFile) => {
                if (!callbacks.onSelectMainFile) {
                    selectFile (0);
                } else {
                    callbacks.onSelectMainFile (fileNames, selectFile);
                }
            },
            onImportSuccess : (importResult) => {
                callbacks.onVisualizationStart ();
                let params = new OV.ModelToThreeConversionParams ();
                params.forceMediumpForMaterials = this.hasHighpDriverIssue;
                let output = new OV.ModelToThreeConversionOutput ();
                OV.ConvertModelToThreeObject (importResult.model, params, output, {
                    onTextureLoaded : () => {
                        callbacks.onTextureLoaded ();
                    },
                    onModelLoaded : (threeObject) => {
                        this.defaultMaterial = output.defaultMaterial;
                        callbacks.onModelFinished (importResult, threeObject);
                        this.inProgress = false;
                    }
                });
            },
            onImportError : (importError) => {
                callbacks.onLoadError (importError);
                this.inProgress = false;
            }
        });
    }

    GetImporter ()
    {
        return this.importer;
    }

    GetDefaultMaterial ()
    {
        return this.defaultMaterial;
    }

    ReplaceDefaultMaterialColor (defaultColor)
    {
        if (this.defaultMaterial !== null) {
            this.defaultMaterial.color = new THREE.Color (defaultColor.r / 255.0, defaultColor.g / 255.0, defaultColor.b / 255.0);
        }
    }
};
