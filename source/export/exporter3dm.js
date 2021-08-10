OV.Exporter3dm = class extends OV.ExporterBase
{
	constructor ()
	{
		super ();
        this.rhino = null;
	}

    CanExport (format, extension)
    {
        return format === OV.FileFormat.Binary && extension === '3dm';
    }
    
	ExportContent (model, format, files, onFinish)
	{
		if (this.rhino === null) {
			OV.LoadExternalLibrary ('loaders/rhino3dm.min.js').then (() => {
                rhino3dm ().then ((rhino) => {
                    this.rhino = rhino;
                    this.ExportRhinoContent (model, files, onFinish);
                });
            }).catch (() => {
                onFinish ();
            });
		} else {
			this.ExportRhinoContent (model, files, onFinish);
		}
	}

    ExportRhinoContent (model, files, onFinish)
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

		let rhinoFile = new OV.ExportedFile ('model.3dm');
		files.push (rhinoFile);

        let rhinoDoc = new this.rhino.File3dm ();
        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            let meshBuffer = OV.ConvertMeshToMeshBuffer (mesh);
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

                let material = model.GetMaterial (primitive.material);
                let rhinoMaterial = new this.rhino.Material ();
                rhinoMaterial.name = this.GetExportedMaterialName (material.name);
                rhinoMaterial.ambientColor = ColorToRhinoColor (material.ambient);
                rhinoMaterial.diffuseColor = ColorToRhinoColor (material.color);
                rhinoMaterial.specularColor = ColorToRhinoColor (material.specular);
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
        }

        let writeOptions = new this.rhino.File3dmWriteOptions ();
        writeOptions.version = 6;
        let rhinoDocBuffer = rhinoDoc.toByteArray (writeOptions);

        rhinoFile.SetContent (rhinoDocBuffer);
		onFinish ();
    }
};
