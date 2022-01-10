import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { GetModelWithOneMesh, GetTetrahedronMesh, GetTwoCubesConnectingInOneEdgeModel, GetTwoCubesConnectingInOneFaceModel, GetTwoCubesConnectingInOneVertexModel } from '../utils/testutils.js';

export default function suite ()
{

describe ('Model Utils', function () {
    it ('Mesh Bounding Box', function () {
        var cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        let cubeBounds = OV.GetBoundingBox (cube);
        assert.ok (OV.CoordIsEqual3D (cubeBounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (cubeBounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Mesh Instance Bounding Box', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        let transformation = new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0));
        let node = new OV.Node ();
        node.SetTransformation (transformation);
        let cubeInstance = new OV.MeshInstance (null, node, cube);
        let cubeInstanceBounds = OV.GetBoundingBox (cubeInstance);
        assert.ok (OV.CoordIsEqual3D (cubeInstanceBounds.min, new OV.Coord3D (2.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (cubeInstanceBounds.max, new OV.Coord3D (3.0, 1.0, 1.0)));
    });

    it ('Model Bounding Box', function () {
        var model = new OV.Model ();

        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMeshToRootNode (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMeshToRootNode (mesh2);

        OV.FinalizeModel (model);

        let mesh1Bounds = OV.GetBoundingBox (model.GetMesh (0));
        assert.ok (OV.CoordIsEqual3D (mesh1Bounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (mesh1Bounds.max, new OV.Coord3D (1.0, 1.0, 0.0)));

        let mesh2Bounds = OV.GetBoundingBox (model.GetMesh (1));
        assert.ok (OV.CoordIsEqual3D (mesh2Bounds.min, new OV.Coord3D (0.0, 0.0, 1.0)));
        assert.ok (OV.CoordIsEqual3D (mesh2Bounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));

        let modelBounds = OV.GetBoundingBox (model);
        assert.ok (OV.CoordIsEqual3D (modelBounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert.ok (OV.CoordIsEqual3D (modelBounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Tetrahedron Topology Calculation', function () {
        let tetrahedron = GetModelWithOneMesh (GetTetrahedronMesh ());
        let topology = OV.GetTopology (tetrahedron);
        assert.ok (OV.IsSolid (tetrahedron));
        assert.strictEqual (topology.vertices.length, 4);
        assert.strictEqual (topology.edges.length, 6);
        assert.strictEqual (topology.triangleEdges.length, 4 * 3);
        assert.strictEqual (topology.triangles.length, 4);
        for (let i = 0; i < topology.vertices.length; i++) {
            assert.strictEqual (topology.vertices[i].edges.length, 3);
            assert.strictEqual (topology.vertices[i].triangles.length, 3);
        }
        for (let i = 0; i < topology.edges.length; i++) {
            assert.strictEqual (topology.edges[i].triangles.length, 2);
        }
    });

    it ('Cube Topology Calculation', function () {
        let cube = GetModelWithOneMesh (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        assert.ok (OV.IsSolid (cube));

        let topology = OV.GetTopology (cube);
        assert.strictEqual (topology.vertices.length, 8);
        assert.strictEqual (topology.edges.length, 12 + 6);
        assert.strictEqual (topology.triangleEdges.length, 6 * 2 * 3);
        assert.strictEqual (topology.triangles.length, 6 * 2);

        let verticesWith4Triangles = 0;
        let verticesWith5Triangles = 0;
        let verticesWith4Edges = 0;
        let verticesWith5Edges = 0;
        for (let i = 0; i < topology.vertices.length; i++) {
            if (topology.vertices[i].triangles.length == 4) {
                verticesWith4Triangles += 1;
            } else if (topology.vertices[i].triangles.length == 5) {
                verticesWith5Triangles += 1;
            }
            if (topology.vertices[i].edges.length == 4) {
                verticesWith4Edges += 1;
            } else if (topology.vertices[i].edges.length == 5) {
                verticesWith5Edges += 1;
            }
        }
        assert.strictEqual (verticesWith4Triangles, 4);
        assert.strictEqual (verticesWith5Triangles, 4);
        assert.strictEqual (verticesWith4Edges, 4);
        assert.strictEqual (verticesWith5Edges, 4);

        for (let i = 0; i < topology.edges.length; i++) {
            assert.strictEqual (topology.edges[i].triangles.length, 2);
        }
    });

    it ('Two Cubes Connecting in One Vertex Topology Calculation', function () {
        const model = GetTwoCubesConnectingInOneVertexModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 15);
        assert.ok (OV.IsSolid (model));
    });

    it ('Two Cubes Connecting in One Edge Topology Calculation', function () {
        const model = GetTwoCubesConnectingInOneEdgeModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 14);
        assert.ok (OV.IsSolid (model));
    });

    it ('Two Cubes Connecting in One Face Topology Calculation', function () {
        const model = GetTwoCubesConnectingInOneFaceModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 12);
        assert.ok (OV.IsSolid (model));
    });
});

}
