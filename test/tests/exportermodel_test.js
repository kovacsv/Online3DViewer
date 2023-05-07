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

function CreateHierarchicalTestModel ()
{
    let model = new OV.Model ();

    let material1 = new OV.PhongMaterial ();
    material1.name = 'Material 1';
    model.AddMaterial (material1);

    let material2 = new OV.PhongMaterial ();
    material2.name = 'Material 1';
    model.AddMaterial (material2);

    let cubeParams1 = new OV.GeneratorParams ().SetMaterial (0);
    let cube1 = OV.GenerateCuboid (cubeParams1, 1.0, 1.0, 1.0);
    let cube1Mesh = model.AddMesh (cube1);

    let cubeParams2 = new OV.GeneratorParams ().SetMaterial (1);
    let cube2 = OV.GenerateCuboid (cubeParams2, 1.0, 1.0, 1.0);
    let cube2Mesh = model.AddMesh (cube2);

    let root = model.GetRootNode ();
    let node1 = new OV.Node ();
    node1.SetName ('Node 1');

    let node11 = new OV.Node ();
    node11.SetName ('Node 1.1');
    node11.AddMeshIndex (cube1Mesh);
    node1.AddChildNode (node11);

    let node12 = new OV.Node ();
    node12.SetName ('Node 1.2');
    node12.AddMeshIndex (cube2Mesh);
    node12.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0)));
    node1.AddChildNode (node12);

    let node13 = new OV.Node ();
    node13.SetName ('Node 1.2');
    node13.AddMeshIndex (cube2Mesh);
    node13.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (4.0, 0.0, 0.0)));
    node1.AddChildNode (node13);

    root.AddChildNode (node1);

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

    it ('Hierarchical model test no filter', function () {
        let model = CreateHierarchicalTestModel ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return true;
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (5.0, 1.0, 1.0)));
    });

    it ('Hierarchical model test filter', function () {
        let model = CreateHierarchicalTestModel ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 1));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 2);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 1.0, 1.0)));
    });

    it ('Hierarchical model test filter 2', function () {
        let model = CreateHierarchicalTestModel ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 1)) && !meshInstanceId.IsEqual (new OV.MeshInstanceId (2, 1));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 1);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });
});

}
