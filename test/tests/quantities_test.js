var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

describe ('Quantities', function () {
    it ('Cube Volume Calculation', function () {
        const model = testUtils.GetModelWithOneMesh (testUtils.GetCubeMesh ());
        const volume = OV.CalculateModelVolume (model);
        assert (OV.IsEqual (volume, 1.0));
    });

    it ('Cube with Missing Face Volume Calculation', function () {
        const model = testUtils.GetModelWithOneMesh (testUtils.GetCubeWithOneMissingFaceMesh ());
        const volume = OV.CalculateModelVolume (model);
        assert.strictEqual (volume, null);
    });

    it ('Cube Surface Area Calculation', function () {
        const model = testUtils.GetModelWithOneMesh (testUtils.GetCubeMesh ());
        const surface = OV.CalculateModelSurfaceArea (model);
        assert (OV.IsEqual (surface, 6.0));
    });

    it ('Cube with Missing Face Surface Area Calculation', function () {
        const model = testUtils.GetModelWithOneMesh (testUtils.GetCubeWithOneMissingFaceMesh ());
        const surface = OV.CalculateModelSurfaceArea (model);
        assert (OV.IsEqual (surface, 5.0));
    });

    it ('Tetrahedron Volume Calculation', function () {
        let edgeLength = OV.CoordDistance3D (new OV.Coord3D (1.0, 1.0, 1.0), new OV.Coord3D (-1.0, -1.0, 1.0));
        const model = testUtils.GetModelWithOneMesh (testUtils.GetTetrahedronMesh ());
        const volume = OV.CalculateModelVolume (model);
        assert (OV.IsEqual (volume, Math.pow (edgeLength, 3.0) / (6.0 * Math.sqrt (2))));
    });

    it ('Tetrahedron Surface Area Calculation', function () {
        let edgeLength = OV.CoordDistance3D (new OV.Coord3D (1.0, 1.0, 1.0), new OV.Coord3D (-1.0, -1.0, 1.0));
        const model = testUtils.GetModelWithOneMesh (testUtils.GetTetrahedronMesh ());
        const surface = OV.CalculateModelSurfaceArea (model);
        assert (OV.IsEqual (surface, Math.sqrt (3) * Math.pow (edgeLength, 2.0)));
    });
});
