var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

describe ('Model Utils', function () {
    it ('Create Merged Model', function () {
        var model = new OV.Model ();
        
        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        OV.FinalizeModel (model, function () { return new OV.Material (); });
        assert.deepStrictEqual (testUtils.ModelToObject (model), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                },
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                }
            ]
        });

        var mergedModel = OV.CreateMergedModel (model);
        assert.deepStrictEqual (testUtils.ModelToObject (mergedModel), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        },
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }                        
                    ]
                }
            ]
        });        
    });

    it ('Mesh Bounding Box', function () {
        var cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        let cubeBounds = OV.GetBoundingBox (cube);
        assert (OV.CoordIsEqual3D (cubeBounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (cubeBounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Model Bounding Box', function () {
        var model = new OV.Model ();
        
        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        OV.FinalizeModel (model, function () { return new OV.Material (); });

        let mesh1Bounds = OV.GetBoundingBox (model.GetMesh (0));
        assert (OV.CoordIsEqual3D (mesh1Bounds.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (mesh1Bounds.max, new OV.Coord3D (1.0, 1.0, 0.0)));

        let mesh2Bounds = OV.GetBoundingBox (model.GetMesh (1));
        assert (OV.CoordIsEqual3D (mesh2Bounds.min, new OV.Coord3D (0.0, 0.0, 1.0)));
        assert (OV.CoordIsEqual3D (mesh2Bounds.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Tetrahedron Topology Calculation', function () {
        let tetrahedron = testUtils.GetModelWithOneMesh (testUtils.GetTetrahedronMesh ());
        let topology = OV.GetTopology (tetrahedron);
        assert (OV.IsSolid (tetrahedron));
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
        let cube = testUtils.GetModelWithOneMesh (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        assert (OV.IsSolid (cube));

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
        const model = testUtils.GetTwoCubesConnectingInOneVertexModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 15);
        assert (OV.IsSolid (model));
    });  

    it ('Two Cubes Connecting in One Edge Topology Calculation', function () {
        const model = testUtils.GetTwoCubesConnectingInOneEdgeModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 14);
        assert (OV.IsSolid (model));
    });

    it ('Two Cubes Connecting in One Face Topology Calculation', function () {
        const model = testUtils.GetTwoCubesConnectingInOneFaceModel ();
        let topology = OV.GetTopology (model);
        assert.strictEqual (topology.vertices.length, 12);
        assert (OV.IsSolid (model));
    });     
});
