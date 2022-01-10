import { Importer } from '../import/importer.js';
import { ConvertModelToThreeObject, ModelToThreeConversionOutput, ModelToThreeConversionParams } from './threeconverter.js';
import { ConvertColorToThreeColor, HasHighpDriverIssue } from './threeutils.js';

export class ThreeModelLoader
{
    constructor ()
    {
        this.importer = new Importer ();
        this.inProgress = false;
        this.defaultMaterial = null;
        this.hasHighpDriverIssue = HasHighpDriverIssue ();
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
                let params = new ModelToThreeConversionParams ();
                params.forceMediumpForMaterials = this.hasHighpDriverIssue;
                let output = new ModelToThreeConversionOutput ();
                ConvertModelToThreeObject (importResult.model, params, output, {
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
        if (this.defaultMaterial !== null && !this.defaultMaterial.vertexColors) {
            this.defaultMaterial.color = ConvertColorToThreeColor (defaultColor);
        }
    }
}
