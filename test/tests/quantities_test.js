var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

describe ('Quantities', function () {
    it ('Cube Volume Calculation', function () {
        const mesh = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert (OV.IsEqual (OV.CalculateVolume (mesh), 1.0));
        assert (OV.IsEqual (OV.CalculateVolume (model), 1.0));
    });

    it ('Cube with Missing Face Volume Calculation', function () {
        const mesh = testUtils.GetCubeWithOneMissingFaceMesh ();
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert.strictEqual (OV.CalculateVolume (model), null);
    });

    it ('Two Cubes Connecting in One Vertex Volume Calculation', function () {
        const model = testUtils.GetTwoCubesConnectingInOneVertexModel ();
        assert (OV.IsEqual (OV.CalculateVolume (model), 2.0));
    });  

    it ('Two Cubes Connecting in One Edge Volume Calculation', function () {
        const model = testUtils.GetTwoCubesConnectingInOneEdgeModel ();
        assert (OV.IsEqual (OV.CalculateVolume (model), 2.0));
    });

    it ('Two Cubes Connecting in One Face Volume Calculation', function () {
        const model = testUtils.GetTwoCubesConnectingInOneFaceModel ();
        assert (OV.IsEqual (OV.CalculateVolume (model), 2.0));
    });  

    it ('Cube with Wrongly Oriented Triangle Volume Calculation', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 5));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6));
        mesh.AddTriangle (new OV.Triangle (4, 7, 6));
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert.strictEqual (OV.CalculateVolume (mesh), null);
        assert.strictEqual (OV.CalculateVolume (model), null);
    });

    it ('Cube Surface Area Calculation', function () {
        const mesh = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert (OV.IsEqual (OV.CalculateSurfaceArea (mesh), 6.0));
        assert (OV.IsEqual (OV.CalculateSurfaceArea (model), 6.0));
    });

    it ('Cube with Missing Face Surface Area Calculation', function () {
        const mesh = testUtils.GetCubeWithOneMissingFaceMesh ();
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert (OV.IsEqual (OV.CalculateSurfaceArea (mesh), 5.0));
        assert (OV.IsEqual (OV.CalculateSurfaceArea (model), 5.0));
    });

    it ('Tetrahedron Volume Calculation', function () {
        let edgeLength = OV.CoordDistance3D (new OV.Coord3D (1.0, 1.0, 1.0), new OV.Coord3D (-1.0, -1.0, 1.0));
        const mesh = testUtils.GetTetrahedronMesh ();
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert (OV.IsEqual (OV.CalculateVolume (mesh), Math.pow (edgeLength, 3.0) / (6.0 * Math.sqrt (2))));
        assert (OV.IsEqual (OV.CalculateVolume (model), Math.pow (edgeLength, 3.0) / (6.0 * Math.sqrt (2))));
    });

    it ('Tetrahedron Surface Area Calculation', function () {
        let edgeLength = OV.CoordDistance3D (new OV.Coord3D (1.0, 1.0, 1.0), new OV.Coord3D (-1.0, -1.0, 1.0));
        const mesh = testUtils.GetTetrahedronMesh ();
        const model = testUtils.GetModelWithOneMesh (mesh);
        assert (OV.IsEqual (OV.CalculateSurfaceArea (mesh), Math.sqrt (3) * Math.pow (edgeLength, 2.0)));
        assert (OV.IsEqual (OV.CalculateSurfaceArea (model), Math.sqrt (3) * Math.pow (edgeLength, 2.0)));
    });
});
