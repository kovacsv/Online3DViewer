// Prints the BREP faces of a STEP file in the order the viewer numbers them for face highlights,
// so the numbering can be compared with another reader, for example FreeCAD's shape.Faces or the
// backend's TopExp::MapShapes. The file is read with the same occt-import-js and parameters as the
// viewer, and the model is built and finalized by the viewer's own importer.
//
// Usage: node tools/dump_step_faces.mjs <file.step> [--json]
// Prints index, mesh instance, mesh name, triangle count, area (mm2) and the area weighted
// centroid (mm) of every face. A face that didn't triangulate has no triangles, area 0 and no
// centroid, it still has an index.

import * as fs from 'fs';
import { createRequire } from 'module';

import * as OV from '../source/engine/main.js';

const require = createRequire (import.meta.url);
const occtimportjs = require ('occt-import-js');

function FaceStats (meshInstance, first, last)
{
    let stats = { triangleCount : 0, area : 0.0, centroid : null };
    if (first > last) {
        return stats;
    }
    let geometry = OV.CollectFaceGeometry (meshInstance.GetMesh (), meshInstance.GetTransformation (), first, last);
    let p = geometry.positions;
    let sum = [0.0, 0.0, 0.0];
    for (let i = 0; i < geometry.triangles.length; i += 3) {
        let a = geometry.triangles[i] * 3;
        let b = geometry.triangles[i + 1] * 3;
        let c = geometry.triangles[i + 2] * 3;
        let u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
        let v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        let area = 0.5 * Math.hypot (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]);
        for (let axis = 0; axis < 3; axis++) {
            sum[axis] += area * (p[a + axis] + p[b + axis] + p[c + axis]) / 3.0;
        }
        stats.area += area;
    }
    stats.triangleCount = geometry.triangles.length / 3;
    if (stats.area > 0.0) {
        stats.centroid = sum.map ((value) => value / stats.area);
    }
    return stats;
}

async function Main (argv)
{
    let filePath = argv.find ((arg) => !arg.startsWith ('--'));
    let asJson = argv.includes ('--json');
    if (filePath === undefined) {
        console.error ('Usage: node tools/dump_step_faces.mjs <file.step> [--json]');
        process.exit (1);
    }

    let occt = await occtimportjs ();
    let content = new Uint8Array (fs.readFileSync (filePath));
    // The parameters of ImporterOcct.
    let result = occt.ReadStepFile (content, {
        linearUnit : 'millimeter',
        linearDeflectionType : 'bounding_box_ratio',
        linearDeflection : 0.001,
        angularDeflection : 0.5
    });
    if (!result.success) {
        console.error ('occt-import-js could not read ' + filePath);
        process.exit (1);
    }

    let importer = new OV.ImporterOcct ();
    importer.model = new OV.Model ();
    importer.ImportResultJson (result, () => {});
    let model = importer.model;
    OV.FinalizeModel (model, {
        defaultLineMaterialColor : new OV.RGBColor (0, 0, 0),
        defaultMaterialColor : new OV.RGBColor (200, 200, 200)
    });

    let faces = OV.GetModelFaces (model).map ((face, index) => {
        let stats = FaceStats (face.meshInstance, face.first, face.last);
        return {
            index : index,
            meshInstance : face.meshInstance.GetId ().GetKey (),
            meshName : face.meshInstance.GetMesh ().GetName (),
            triangleCount : stats.triangleCount,
            area : stats.area,
            centroid : stats.centroid
        };
    });

    if (asJson) {
        console.log (JSON.stringify ({ file : filePath, faceCount : faces.length, faces : faces }, null, 2));
        return;
    }
    console.log ('index,mesh_instance,mesh_name,triangles,area,cx,cy,cz');
    for (let face of faces) {
        let centroid = (face.centroid === null ? ['', '', ''] : face.centroid.map ((value) => value.toFixed (4)));
        console.log ([face.index, face.meshInstance, JSON.stringify (face.meshName), face.triangleCount, face.area.toFixed (4), ...centroid].join (','));
    }
    console.error (faces.length.toString () + ' faces');
}

Main (process.argv.slice (2));
