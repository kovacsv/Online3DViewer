import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { CreateTestModelForExport, CreateHierarchicalTestModelForExport } from '../utils/testutils.js';

export default function suite ()
{

function GetExporterModelBoundingBox (exporterModel)
{
    let calculator = new OV.BoundingBoxCalculator3D ();
    exporterModel.EnumerateTransformedMeshInstances ((mesh) => {
        mesh.EnumerateVertices ((vertex) => {
            calculator.AddPoint (vertex);
        });

    });
    return calculator.GetBox ();
}

describe ('Exporter Model', function () {
    it ('No filter test', function () {
        let model = CreateTestModelForExport ();
        let exporterModel = new OV.ExporterModel (model);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 1.0, 1.0)));
    });

    it ('Model filter test', function () {
        let model = CreateTestModelForExport ();
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

        let model = CreateTestModelForExport ();
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

        let model = CreateTestModelForExport ();
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
        let model = CreateHierarchicalTestModelForExport ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return true;
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshCount (), 3);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 4);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (7.0, 1.0, 1.0)));
    });

    it ('Hierarchical model test filter 1', function () {
        let model = CreateHierarchicalTestModelForExport ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 1));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshCount (), 3);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (7.0, 1.0, 1.0)));
    });

    it ('Hierarchical model test filter 2', function () {
        let model = CreateHierarchicalTestModelForExport ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (2, 1));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshCount (), 3);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 3);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (7.0, 1.0, 1.0)));
    });

    it ('Hierarchical model test filter 3', function () {
        let model = CreateHierarchicalTestModelForExport ();
        let settings = new OV.ExporterSettings ({
            isMeshVisible : (meshInstanceId) => {
                return !meshInstanceId.IsEqual (new OV.MeshInstanceId (2, 1)) && !meshInstanceId.IsEqual (new OV.MeshInstanceId (3, 1));
            }
        });
        let exporterModel = new OV.ExporterModel (model, settings);
        assert.strictEqual (exporterModel.MeshCount (), 2);
        assert.strictEqual (exporterModel.MeshInstanceCount (), 2);
        assert.strictEqual (exporterModel.MapMeshIndex (0), 0);
        assert.strictEqual (exporterModel.MapMeshIndex (1), undefined);
        assert.strictEqual (exporterModel.MapMeshIndex (2), 1);
        let boundingBox = GetExporterModelBoundingBox (exporterModel);
        assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (7.0, 1.0, 1.0)));
    });
});

}
