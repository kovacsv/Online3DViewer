var assert = require ('assert');

describe ('Generator', function () {
    it ('Cuboid with Default Parameters', function () {
        const cuboid = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        assert (OV.IsSolid (cuboid));
        assert (OV.IsEqual (OV.CalculateVolume (cuboid), 1.0));
    });

    it ('Cuboid with Material', function () {
        const params = new OV.GeneratorParams ().SetMaterial (1);
        const cuboid = OV.GenerateCuboid (params, 1.0, 1.0, 1.0);
        for (let i = 0; i < cuboid.TriangleCount (); i++) {
            const triangle = cuboid.GetTriangle (i);
            assert.strictEqual (triangle.mat, 1);
        }
    });

    it ('Cuboid with Transformation', function () {
        const params = new OV.GeneratorParams ().SetTransformation (
            new OV.Coord3D (1.0, 0.0, 0.0),
            new OV.Quaternion (0.0, 0.0, 0.0, 1.0),
            new OV.Coord3D (1.0, 1.0, 1.0)
        );
        const cuboid = OV.GenerateCuboid (params, 1.0, 1.0, 1.0);
        const bounds = OV.GetBoundingBox (cuboid);
        assert (OV.CoordIsEqual3D (bounds.min, new OV.Coord3D (1.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (bounds.max, new OV.Coord3D (2.0, 1.0, 1.0)));

    });    
});
