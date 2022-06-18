import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { GetModelWithOneMesh, GetTetrahedronMesh, GetTwoCubesConnectingInOneEdgeModel, GetTwoCubesConnectingInOneFaceModel, GetTwoCubesConnectingInOneVertexModel } from '../utils/testutils.js';

export default function suite ()
{

describe ('Topology', function () {
    it ('Tetrahedron Topology Calculation', function () {
        let tetrahedron = GetModelWithOneMesh (GetTetrahedronMesh ());
        let topology = OV.GetTopology (tetrahedron);
        assert.ok (OV.IsTwoManifold (tetrahedron));
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
        assert.ok (OV.IsTwoManifold (cube));

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
        assert.ok (OV.IsTwoManifold (model));
    });

    it ('Two Cubes Connecting in One Edge Topology Calculation', function () {
        const model = GetTwoCubesConnectingInOneEdgeModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 14);
        assert.ok (OV.IsTwoManifold (model));
    });

    it ('Two Cubes Connecting in One Face Topology Calculation', function () {
        const model = GetTwoCubesConnectingInOneFaceModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 12);
        assert.ok (OV.IsTwoManifold (model));
    });
});

}
