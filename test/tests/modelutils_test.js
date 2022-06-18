import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

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
});

}
