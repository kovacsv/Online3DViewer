import { FileFormat } from '../io/fileutils.js';
import { ColorComponentFromFloat } from '../model/color.js';
import { ConvertMeshToMeshBuffer } from '../model/meshbuffer.js';
import { PropertyToString } from '../model/property.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

export class ExporterBim extends ExporterBase
{
    constructor ()
    {
        super ();
    }

    CanExport (format, extension)
    {
        return format === FileFormat.Text && extension === 'bim';
    }

    ExportContent (exporterModel, format, files, onFinish)
    {
        let bimContent = {
            schema_version : '1.0.0',
            meshes : [],
            elements : []
        };

        this.ExportProperties (exporterModel.GetModel (), bimContent);

        let meshId = 0;
        exporterModel.EnumerateTransformedMeshes ((mesh) => {
            let meshBuffer = ConvertMeshToMeshBuffer (mesh);
            for (let primitiveIndex = 0; primitiveIndex < meshBuffer.PrimitiveCount (); primitiveIndex++) {
                let primitive = meshBuffer.GetPrimitive (primitiveIndex);
                let material = exporterModel.GetMaterial (primitive.material);
                let bimMesh = {
                    mesh_id : meshId,
                    coordinates : primitive.vertices,
                    indices : primitive.indices
                };
                let bimElement = {
                    mesh_id : meshId,
                    type : 'Other',
                    color : {
                        r : material.color.r,
                        g : material.color.g,
                        b : material.color.b,
                        a : ColorComponentFromFloat (material.opacity)
                    },
                    vector : {
                        x : 0.0,
                        y : 0.0,
                        z : 0.0
                    },
                    rotation : {
                        qx: 0.0,
                        qy: 0.0,
                        qz: 0.0,
                        qw: 1.0
                    },
                    guid : '00000000-0000-0000-0000-000000000000'
                };
                this.ExportProperties (mesh, bimElement);
                bimContent.meshes.push (bimMesh);
                bimContent.elements.push (bimElement);
                meshId += 1;
            }
        });

        let bimFile = new ExportedFile ('model.bim');
        bimFile.SetTextContent (JSON.stringify (bimContent, null, 4));
        files.push (bimFile);
        onFinish ();
    }

    ExportProperties (element, targetObject)
    {
        let info = {};
        for (let groupIndex = 0; groupIndex < element.PropertyGroupCount (); groupIndex++) {
            let group = element.GetPropertyGroup (groupIndex);
            for (let propertyIndex = 0; propertyIndex < group.PropertyCount (); propertyIndex++) {
                let property = group.GetProperty (propertyIndex);
                info[property.name] = PropertyToString (property);
            }
        }
        if (Object.keys (info).length !== 0) {
            targetObject.info = info;
        }
    }
}
