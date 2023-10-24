import { FileFormat } from '../io/fileutils.js';
import { ColorComponentFromFloat } from '../model/color.js';
import { PropertyToString } from '../model/property.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

function GenerateGuid ()
{
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    let template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace (/[xy]/g, (c) => {
        let r = Math.random () * 16 | 0;
        let v = (c === 'x') ? r : (r & 0x3 | 0x8);
        return v.toString (16);
    });
}

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
            schema_version : '1.1.0',
            meshes : [],
            elements : [],
            info : {}
        };

        this.ExportProperties (exporterModel.GetModel (), bimContent.info);

        let meshId = 0;
        exporterModel.EnumerateTransformedMeshInstances ((mesh) => {
            let bimMesh = {
                mesh_id : meshId,
                coordinates : [],
                indices : []
            };

            mesh.EnumerateVertices ((vertex) => {
                bimMesh.coordinates.push (vertex.x, vertex.y, vertex.z);
            });
            mesh.EnumerateTriangleVertexIndices ((v0, v1, v2) => {
                bimMesh.indices.push (v0, v1, v2);
            });

            let bimElement = {
                mesh_id : meshId,
                type : 'Other',
                color : {
                    r : 200,
                    g : 200,
                    b : 200,
                    a : 255
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
                guid : GenerateGuid (),
                info : {}
            };

            let defaultColor = null;
            let hasOnlyOneColor = true;
            let faceColors = [];
            for (let i = 0; i < mesh.TriangleCount (); i++) {
                let triangle = mesh.GetTriangle (i);
                let material = exporterModel.GetMaterial (triangle.mat);
                let faceColor = {
                    r : Math.round (material.color.r),
                    g : Math.round (material.color.g),
                    b : Math.round (material.color.b),
                    a : ColorComponentFromFloat (material.opacity),
                };
                faceColors.push (faceColor.r, faceColor.g, faceColor.b, faceColor.a);
                if (hasOnlyOneColor) {
                    if (defaultColor === null) {
                        defaultColor = faceColor;
                    } else {
                        if (defaultColor.r !== faceColor.r || defaultColor.g !== faceColor.g || defaultColor.b !== faceColor.b || defaultColor.a !== faceColor.a) {
                            hasOnlyOneColor = false;
                            defaultColor = null;
                        }
                    }
                }
            }

            if (hasOnlyOneColor) {
                bimElement.color = defaultColor;
            } else {
                bimElement.face_colors = faceColors;
            }

            bimElement.info['Name'] = mesh.GetName ();
            this.ExportProperties (mesh, bimElement.info);

            bimContent.meshes.push (bimMesh);
            bimContent.elements.push (bimElement);
            meshId += 1;
        });

        let bimFile = new ExportedFile ('model.bim');
        bimFile.SetTextContent (JSON.stringify (bimContent, null, 4));
        files.push (bimFile);
        onFinish ();
    }

    ExportProperties (element, targetObject)
    {
        for (let groupIndex = 0; groupIndex < element.PropertyGroupCount (); groupIndex++) {
            let group = element.GetPropertyGroup (groupIndex);
            for (let propertyIndex = 0; propertyIndex < group.PropertyCount (); propertyIndex++) {
                let property = group.GetProperty (propertyIndex);
                targetObject[property.name] = PropertyToString (property);
            }
        }
    }
}
