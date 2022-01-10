import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

function CreateTestModel ()
{
    let model = new OV.Model ();

    for (let i = 0; i < 3; i++) {
        let material = new OV.PhongMaterial ();
        material.name = 'Material ' + i.toString ();
        model.AddMaterial (material);
    }

    let root = model.GetRootNode ();
    for (let i = 0; i < 3; i++) {
        let genParams = new OV.GeneratorParams ().SetMaterial (i);
        let cube = OV.GenerateCuboid (genParams, 1.0, 1.0, 1.0);
        let meshIndex = model.AddMesh (cube);
        let node = new OV.Node ();
        node.AddMeshIndex (meshIndex);
        node.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (i, 0.0, 0.0)));
        root.AddChildNode (node);
    }

    OV.FinalizeModel (model);
    return model;
}

function GetExporterModelBoundingBox (exporterModel)
{
    let calculator = new OV.BoundingBoxCalculator3D ();
    exporterModel.EnumerateTransformedMeshes ((mesh) => {
        mesh.EnumerateVertices ((vertex) => {
            calculator.AddPoint (vertex);
        });

    });
    return calculator.GetBox ();
}

describe ('Exporter Model', function () {
    it ('No filter test', function () {
        let model = CreateTestModel ();
        let exporterModel = new OV.ExporterModel (model);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 1.0, 1.0)));
    });

    it ('Model filter test', function () {
        let model = CreateTestModel ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 2));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 2);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (2.0, 1.0, 1.0)));
    });

    it ('Model transformation test', function () {
        let rotation = OV.QuaternionFromAxisAngle (new OV.Coord3D (0.0, 1.0, 0.0), -Math.PI / 2.0);

        let model = CreateTestModel ();
        let settings = new OV.ExporterSettings ({
            transformation : new OV.Transformation (new OV.Matrix ().CreateRotation (rotation.x, rotation.y, rotation.z, rotation.w))
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (0.0, 1.0, 3.0)));
    });

    it ('Model filter and transformation test', function () {
        let rotation = OV.QuaternionFromAxisAngle (new OV.Coord3D (0.0, 1.0, 0.0), -Math.PI / 2.0);

        let model = CreateTestModel ();
        let settings = new OV.ExporterSettings ({
            transformation : new OV.Transformation (new OV.Matrix ().CreateRotation (rotation.x, rotation.y, rotation.z, rotation.w)),
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 2));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 2);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (0.0, 1.0, 2.0)));
    });
});

}
