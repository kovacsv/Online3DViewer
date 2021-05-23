var assert = require ('assert');

describe ('Generator', function () {
    it ('Cuboid', function () {
        const cuboid = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        assert (OV.IsSolid (cuboid));
        assert (OV.IsEqual (OV.CalculateVolume (cuboid), 1.0));
    });
});
