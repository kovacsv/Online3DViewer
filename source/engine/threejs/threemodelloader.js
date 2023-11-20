import { Direction } from '../geometry/geometry.js';
import { Importer } from '../import/importer.js';
import { RevokeObjectUrl } from '../io/bufferutils.js';
import { MaterialSource } from '../model/material.js';
import { ConvertModelToThreeObject, ModelToThreeConversionOutput, ModelToThreeConversionParams } from './threeconverter.js';
import { ConvertColorToThreeColor, HasHighpDriverIssue } from './threeutils.js';

import * as THREE from 'three';

export class ThreeModelLoader
{
    constructor ()
    {
        this.importer = new Importer ();
        this.inProgress = false;
        this.defaultMaterials = null;
        this.objectUrls = null;
        this.hasHighpDriverIssue = HasHighpDriverIssue ();
    }

    InProgress ()
    {
        return this.inProgress;
    }

    LoadModel (inputFiles, settings, callbacks)
    {
        if (this.inProgress) {
            return;
        }

        this.inProgress = true;
        this.RevokeObjectUrls ();
        this.importer.ImportFiles (inputFiles, settings, {
            onLoadStart : () => {
                callbacks.onLoadStart ();
            },
            onFileListProgress : (current, total) => {
                callbacks.onFileListProgress (current, total);
            },
            onFileLoadProgress : (current, total) => {
                callbacks.onFileLoadProgress (current, total);
            },
            onImportStart : () => {
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
                        this.defaultMaterials = output.defaultMaterials;
                        this.objectUrls = output.objectUrls;
                        if (importResult.upVector === Direction.X) {
                            let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (0.0, 0.0, 1.0), Math.PI / 2.0);
                            threeObject.quaternion.multiply (rotation);
                        } else if (importResult.upVector === Direction.Z) {
                            let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (1.0, 0.0, 0.0), -Math.PI / 2.0);
                            threeObject.quaternion.multiply (rotation);
                        }
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

    GetDefaultMaterials ()
    {
        return this.defaultMaterials;
    }

    ReplaceDefaultMaterialsColor (defaultColor, defaultLineColor)
    {
        if (this.defaultMaterials !== null) {
            for (let defaultMaterial of this.defaultMaterials) {
                if (!defaultMaterial.vertexColors) {
                    if (defaultMaterial.userData.source === MaterialSource.DefaultFace) {
                        defaultMaterial.color = ConvertColorToThreeColor (defaultColor);
                    } else if (defaultMaterial.userData.source === MaterialSource.DefaultLine) {
                        defaultMaterial.color = ConvertColorToThreeColor (defaultLineColor);
                    }
                }
            }
        }
    }

    RevokeObjectUrls ()
    {
        if (this.objectUrls === null) {
            return;
        }
        for (let objectUrl of this.objectUrls) {
            RevokeObjectUrl (objectUrl);
        }
        this.objectUrls = null;
    }

    Destroy ()
    {
        this.RevokeObjectUrls ();
        this.importer = null;
    }
}
