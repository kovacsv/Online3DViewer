var assert = require ('assert');

function CreateYRot90Quaternion ()
{
    let angle = Math.PI / 2.0;
    let rotX = 0.0;
    let rotY = 1.0;
    let rotZ = 0.0;
    let quaternion = [
        Math.sin (angle / 2.0) * rotX,
        Math.sin (angle / 2.0) * rotY,
        Math.sin (angle / 2.0) * rotZ,
        Math.cos (angle / 2.0)
    ];
    return quaternion;
}

describe ('Coord', function () {
    it ('Length', function () {
        var c = new OV.Coord3D (2.0, 0.0, 0.0);
        assert.strictEqual (c.Length (), 2.0);
    });
    
    it ('Multiply Scalar', function () {
        var c = new OV.Coord3D (2.0, 0.0, 0.0);
        c.MultiplyScalar (3.0);
        assert.strictEqual (c.x, 6.0);
        assert.strictEqual (c.y, 0.0);
        assert.strictEqual (c.z, 0.0);
    });        
    
    it ('Normalize', function () {
        var c = new OV.Coord3D (2.0, 0.0, 0.0);
        c.Normalize ();
        assert.strictEqual (c.x, 1.0);
        assert.strictEqual (c.y, 0.0);
        assert.strictEqual (c.z, 0.0);
    });    
});

describe ('Triangle', function() {
    it ('Calculate Normal', function () {
        var normal = OV.CalculateTriangleNormal (
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (1.0, 0.0, 0.0),
            new OV.Coord3D (1.0, 1.0, 0.0)
        );
        assert.strictEqual (normal.x, 0.0);
        assert.strictEqual (normal.y, 0.0);
        assert.strictEqual (normal.z, 1.0);
    });
});

describe ('Transformation', function() {
    it ('Basic Test', function () {
        let rotation = CreateYRot90Quaternion ();

        let coord = new OV.Coord3D (1.0, 2.0, 3.0);

        let tr = new OV.Transformation ();
        assert (tr.IsIdentity ());
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (1.0, 2.0, 3.0)));

        tr.AppendMatrix (new OV.Matrix ().CreateScale (3.0, 4.0, 5.0));
        assert (!tr.IsIdentity ());
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (3.0, 8.0, 15.0)));

        tr.AppendMatrix (new OV.Matrix ().CreateRotation (rotation[0], rotation[1], rotation[2], rotation[3]));
        assert (!tr.IsIdentity ());
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (15.0, 8.0, -3.0)));
        
        tr.AppendMatrix (new OV.Matrix ().CreateTranslation (4.0, 5.0, 6.0));
        assert (!tr.IsIdentity ());
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (19.0, 13.0, 3.0)));

        let tr2 = new OV.Transformation ();
        tr2.SetMatrix (new OV.Matrix ().ComposeTRS ([4.0, 5.0, 6.0], rotation, [3.0, 4.0, 5.0]));
        assert (OV.CoordIsEqual3D (tr2.TransformCoord3D (coord), new OV.Coord3D (19.0, 13.0, 3.0)));
    });

    it ('TRS Compose Test', function () {
        let rotation = CreateYRot90Quaternion ();
        let coord = new OV.Coord3D (1.0, 2.0, 3.0);

        let tr = new OV.Transformation ();
        tr.SetMatrix (new OV.Matrix ().ComposeTRS ([4.0, 5.0, 6.0], rotation, [3.0, 4.0, 5.0]));
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (19.0, 13.0, 3.0)));
    });    

    it ('TRS Compose Test', function () {
        let rotation = CreateYRot90Quaternion ();
        let coord = new OV.Coord3D (1.0, 2.0, 3.0);

        let tr = new OV.Transformation ();
        tr.SetMatrix (new OV.Matrix ().ComposeTRS ([4.0, 5.0, 6.0], rotation, [3.0, 4.0, 5.0]));
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), new OV.Coord3D (19.0, 13.0, 3.0)));

        let trs = tr.GetMatrix ().DecomposeTRS ();
        let tr2 = new OV.Transformation ();
        tr2.SetMatrix (new OV.Matrix ().ComposeTRS (trs.translation, trs.rotation, trs.scale));
        assert (OV.CoordIsEqual3D (tr2.TransformCoord3D (coord), new OV.Coord3D (19.0, 13.0, 3.0)));
    });

    it ('Default Quaternion Test', function () {
        let coord = new OV.Coord3D (1.0, 2.0, 3.0);

        let tr = new OV.Transformation ();
        tr.SetMatrix (new OV.Matrix ().CreateRotation (0.0, 0.0, 0.0, 1.0));
        assert (OV.CoordIsEqual3D (tr.TransformCoord3D (coord), coord));
    });        
});

describe ('Tween', function() {
    it ('Linear Tween Function', function () {
        assert (OV.IsEqual (OV.LinearTweenFunction (10.0, 0, 10), 0.0));
        assert (OV.IsEqual (OV.LinearTweenFunction (10.0, 1, 10), 1.0));
        assert (OV.IsEqual (OV.LinearTweenFunction (10.0, 5, 10), 5.0));
        assert (OV.IsEqual (OV.LinearTweenFunction (10.0, 9, 10), 9.0));
        assert (OV.IsEqual (OV.LinearTweenFunction (10.0, 10, 10), 10.0));
    });

    it ('Bezier Tween Function', function () {
        assert (OV.IsEqual (OV.BezierTweenFunction (10.0, 0, 10), 0.0));
        assert (OV.IsEqual (OV.BezierTweenFunction (10.0, 1, 10), 0.28));
        assert (OV.IsEqual (OV.BezierTweenFunction (10.0, 5, 10), 5.0));
        assert (OV.IsEqual (OV.BezierTweenFunction (10.0, 9, 10), 9.72));
        assert (OV.IsEqual (OV.BezierTweenFunction (10.0, 10, 10), 10.0));
    });

    it ('Parabolic Tween Function', function () {
        assert (OV.IsEqual (OV.ParabolicTweenFunction (10.0, 0, 10), 0.0));
        assert (OV.IsEqual (OV.ParabolicTweenFunction (10.0, 5, 10), 5.0));
        assert (OV.IsEqual (OV.ParabolicTweenFunction (10.0, 10, 10), 10.0));
    });    

    it ('Linear Tween Coordinates', function () {
        let beg = new OV.Coord3D (0.0, 0.0, 0.0);
        let end = new OV.Coord3D (9.0, 0.0, 0.0);
        let segments = OV.TweenCoord3D (beg, end, 10, OV.LinearTweenFunction);
        assert.strictEqual (segments.length, 10);
        assert (OV.CoordIsEqual3D (segments[0], beg));
        assert (OV.CoordIsEqual3D (segments[1], new OV.Coord3D (1.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (segments[5], new OV.Coord3D (5.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (segments[segments.length - 1], end));
    });
});
