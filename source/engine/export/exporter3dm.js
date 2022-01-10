import { LoadExternalLibrary } from '../io/externallibs.js';
import { FileFormat } from '../io/fileutils.js';
import { MaterialType } from '../model/material.js';
import { ConvertMeshToMeshBuffer } from '../model/meshbuffer.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

export class Exporter3dm extends ExporterBase
{
	constructor ()
	{
		super ();
        this.rhino = null;
	}

    CanExport (format, extension)
    {
        return format === FileFormat.Binary && extension === '3dm';
    }

	ExportContent (exporterModel, format, files, onFinish)
	{
		if (this.rhino === null) {
			LoadExternalLibrary ('loaders/rhino3dm.min.js').then (() => {
                rhino3dm ().then ((rhino) => {
                    this.rhino = rhino;
                    this.ExportRhinoContent (exporterModel, files, onFinish);
                });
            }).catch (() => {
                onFinish ();
            });
		} else {
			this.ExportRhinoContent (exporterModel, files, onFinish);
		}
	}

    ExportRhinoContent (exporterModel, files, onFinish)
    {
        function ColorToRhinoColor (color)
        {
            return {
                r : color.r,
                g : color.g,
                b : color.b,
                a : 255
            };
        }

		let rhinoFile = new ExportedFile ('model.3dm');
		files.push (rhinoFile);

        let rhinoDoc = new this.rhino.File3dm ();
        exporterModel.EnumerateTransformedMeshes ((mesh) => {
            let meshBuffer = ConvertMeshToMeshBuffer (mesh);
            for (let primitiveIndex = 0; primitiveIndex < meshBuffer.PrimitiveCount (); primitiveIndex++) {
                let primitive = meshBuffer.GetPrimitive (primitiveIndex);
                let threeJson = {
                    data : {
                        attributes : {
                            position : {
                                itemSize : 3,
                                type : 'Float32Array',
                                array : primitive.vertices
                            },
                            normal : {
                                itemSize : 3,
                                type : 'Float32Array',
                                array : primitive.normals
                            }
                        },
                        index : {
                            type : 'Uint16Array',
                            array : primitive.indices
                        }
                    }
                };

                let material = exporterModel.GetMaterial (primitive.material);
                let rhinoMaterial = new this.rhino.Material ();
                rhinoMaterial.name = this.GetExportedMaterialName (material.name);
                if (material.type === MaterialType.Phong) {
                    rhinoMaterial.ambientColor = ColorToRhinoColor (material.ambient);
                    rhinoMaterial.specularColor = ColorToRhinoColor (material.specular);
                }
                rhinoMaterial.diffuseColor = ColorToRhinoColor (material.color);
                rhinoMaterial.transparency = 1.0 - material.opacity;

                let rhinoMaterialIndex = rhinoDoc.materials ().count ();
                rhinoDoc.materials ().add (rhinoMaterial);

                let rhinoMesh = new this.rhino.Mesh.createFromThreejsJSON (threeJson);
                let rhinoAttributes = new this.rhino.ObjectAttributes ();
                rhinoAttributes.name = this.GetExportedMeshName (mesh.GetName ());
                rhinoAttributes.materialSource = this.rhino.ObjectMaterialSource.MaterialFromObject;
                rhinoAttributes.materialIndex = rhinoMaterialIndex;
                rhinoDoc.objects ().add (rhinoMesh, rhinoAttributes);
            }
        });

        let writeOptions = new this.rhino.File3dmWriteOptions ();
        writeOptions.version = 6;
        let rhinoDocBuffer = rhinoDoc.toByteArray (writeOptions);

        rhinoFile.SetBufferContent (rhinoDocBuffer);
		onFinish ();
    }
}
