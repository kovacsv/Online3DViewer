import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

// A 100 x 20 x 10 box from the origin with a BREP face per side, two triangles each: bottom,
// front (y = 0), right (x = 100), back, left, top.
function CreateBoxMesh ()
{
    let mesh = OV.GenerateCuboid (null, 100.0, 20.0, 10.0);
    let brepFaces = [];
    for (let i = 0; i < 6; i++) {
        brepFaces.push ({ first : i * 2, last : i * 2 + 1 });
    }
    mesh.SetBrepFaces (brepFaces);
    return mesh;
}

function CreateBoxModel ()
{
    let model = new OV.Model ();
    model.SetUnit (OV.Unit.Millimeter);
    let meshIndex = model.AddMesh (CreateBoxMesh ());
    model.GetRootNode ().AddMeshIndex (meshIndex);
    return model;
}

// The same box mesh twice, the second one moved up by 100.
function CreateTwoInstanceModel ()
{
    let model = new OV.Model ();
    let meshIndex = model.AddMesh (CreateBoxMesh ());
    model.GetRootNode ().AddMeshIndex (meshIndex);
    let node = new OV.Node ();
    node.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (0.0, 0.0, 100.0)));
    node.AddMeshIndex (meshIndex);
    model.GetRootNode ().AddChildNode (node);
    return model;
}

function Prepare (model, highlights, expectedFaceCount)
{
    let params = new OV.FaceHighlightParams ();
    if (expectedFaceCount !== undefined) {
        params.expectedFaceCount = expectedFaceCount;
    }
    return OV.PrepareFaceHighlights (model, highlights, params);
}

function ZValues (prepared)
{
    let values = new Set ();
    for (let i = 2; i < prepared.positions.length; i += 3) {
        values.add (prepared.positions[i]);
    }
    return Array.from (values).sort ((a, b) => a - b);
}

describe ('Face Highlight', function () {
    it ('Prepares valid highlights', function () {
        let model = CreateBoxModel ();
        let prepared = Prepare (model, [
            { faces : [5], color : '#ff0000' },
            { faces : [0, 1], color : '#0000ff' }
        ], 6);
        assert.ok (prepared.result.ok);
        assert.strictEqual (prepared.result.reason, null);
        assert.strictEqual (prepared.result.faceCount, 3);
        assert.strictEqual (prepared.prepared.length, 1);

        let instance = prepared.prepared[0];
        assert.strictEqual (instance.indices.length, 3 * 2 * 3);
        assert.strictEqual (instance.colors.length, instance.positions.length);
        assert.strictEqual (instance.normals.length, instance.positions.length);
        // Faces go in index order: bottom and front in blue, then the top in red.
        assert.deepStrictEqual (Array.from (instance.colors.slice (0, 3)), [0, 0, 1]);
        assert.deepStrictEqual (Array.from (instance.colors.slice (-3)), [1, 0, 0]);
        assert.ok (instance.meshInstanceId.IsEqual (new OV.MeshInstanceId (0, 0)));
    });

    it ('Numbers the faces of the model', function () {
        assert.strictEqual (OV.GetModelFaces (CreateBoxModel ()).length, 6);
        assert.strictEqual (OV.GetModelFaces (CreateTwoInstanceModel ()).length, 12);
    });

    it ('Accepts an empty list', function () {
        let prepared = Prepare (CreateBoxModel (), [], 6);
        assert.ok (prepared.result.ok);
        assert.strictEqual (prepared.result.faceCount, 0);
        assert.deepStrictEqual (prepared.prepared, []);
    });

    it ('Refuses a model with another face count', function () {
        let prepared = Prepare (CreateBoxModel (), [{ faces : [0], color : '#ff0000' }], 7);
        assert.ok (!prepared.result.ok);
        assert.strictEqual (prepared.prepared, null);
        assert.strictEqual (prepared.result.reason, 'the model has 6 faces, expected 7, the faces may belong to another part');
        // The guard holds for an empty list too, the host learns of the mismatch at once.
        assert.ok (!Prepare (CreateBoxModel (), [], 5).result.ok);
    });

    it ('Refuses a model without BREP faces', function () {
        let model = new OV.Model ();
        let meshIndex = model.AddMesh (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        model.GetRootNode ().AddMeshIndex (meshIndex);
        let prepared = Prepare (model, [{ faces : [0], color : '#ff0000' }]);
        assert.ok (!prepared.result.ok);
        assert.strictEqual (prepared.result.reason, 'the model has no BREP faces');
    });

    it ('Refuses invalid highlights with the highlight index', function () {
        let model = CreateBoxModel ();
        let Reason = (highlights) => Prepare (model, highlights).result.reason;
        assert.strictEqual (Reason (null), 'highlights must be a list');
        assert.strictEqual (Reason ([null]), 'highlight 0: must be an object with faces and color');
        assert.strictEqual (Reason ([{ faces : [0], color : 'red' }]), 'highlight 0: color must be a hex color like #ff0000, got "red"');
        assert.strictEqual (Reason ([{ faces : 0, color : '#ff0000' }]), 'highlight 0: faces must be a list of face indices');
        assert.strictEqual (Reason ([{ faces : [0], color : '#ff0000' }, { faces : [6], color : '#ff0000' }]), 'highlight 1: face 6 is not an index of the model\'s 6 faces');
        assert.strictEqual (Reason ([{ faces : [-1], color : '#ff0000' }]), 'highlight 0: face -1 is not an index of the model\'s 6 faces');
        assert.strictEqual (Reason ([{ faces : [1.5], color : '#ff0000' }]), 'highlight 0: face 1.5 is not an index of the model\'s 6 faces');
        assert.strictEqual (Reason ([{ faces : ['1'], color : '#ff0000' }]), 'highlight 0: face "1" is not an index of the model\'s 6 faces');
    });

    it ('Refuses a face in two highlights', function () {
        let prepared = Prepare (CreateBoxModel (), [
            { faces : [0, 2], color : '#ff0000' },
            { faces : [3, 2], color : '#0000ff' }
        ]);
        assert.ok (!prepared.result.ok);
        assert.strictEqual (prepared.result.reason, 'highlight 1: face 2 is in more than one highlight');
        assert.strictEqual (prepared.prepared, null);
    });

    it ('Refuses an invalid expected face count', function () {
        let prepared = Prepare (CreateBoxModel (), [], -1);
        assert.ok (!prepared.result.ok);
        assert.strictEqual (prepared.result.reason, 'expectedFaceCount must be a non-negative integer, got -1');
    });

    it ('Keeps the index of a face that didn\'t triangulate', function () {
        let mesh = CreateBoxMesh ();
        // Face 1 has no triangles, the ones after it keep their index.
        mesh.SetBrepFaces ([
            { first : 0, last : 1 },
            { first : 2, last : 1 },
            { first : 2, last : 3 },
            { first : 4, last : 5 },
            { first : 6, last : 7 },
            { first : 8, last : 9 },
            { first : 10, last : 11 }
        ]);
        let model = new OV.Model ();
        model.GetRootNode ().AddMeshIndex (model.AddMesh (mesh));

        let empty = Prepare (model, [{ faces : [1], color : '#ff0000' }], 7);
        assert.ok (empty.result.ok);
        assert.strictEqual (empty.result.faceCount, 1);
        assert.deepStrictEqual (empty.prepared, []);

        let top = Prepare (model, [{ faces : [6], color : '#ff0000' }], 7);
        assert.ok (top.result.ok);
        assert.deepStrictEqual (ZValues (top.prepared[0]), [10]);
    });

    it ('Continues the numbering over mesh instances', function () {
        let model = CreateTwoInstanceModel ();
        let prepared = Prepare (model, [{ faces : [0, 11], color : '#ff0000' }], 12);
        assert.ok (prepared.result.ok);
        assert.strictEqual (prepared.prepared.length, 2);
        // The bottom of the first box and the top of the moved one.
        assert.deepStrictEqual (ZValues (prepared.prepared[0]), [0]);
        assert.deepStrictEqual (ZValues (prepared.prepared[1]), [110]);
        assert.ok (!prepared.prepared[0].meshInstanceId.IsEqual (prepared.prepared[1].meshInstanceId));
    });

    it ('Transforms the normals of a moved instance', function () {
        let model = new OV.Model ();
        let meshIndex = model.AddMesh (CreateBoxMesh ());
        let node = new OV.Node ();
        // Turned upside down around the x axis.
        node.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateRotationAxisAngle (new OV.Coord3D (1.0, 0.0, 0.0), Math.PI)));
        node.AddMeshIndex (meshIndex);
        model.GetRootNode ().AddChildNode (node);
        // Gives the mesh normals, as every loaded model has.
        OV.FinalizeModel (model);

        let prepared = Prepare (model, [{ faces : [5], color : '#ff0000' }], 6);
        assert.ok (prepared.result.ok);
        let instance = prepared.prepared[0];
        // The top at z = 10 goes to z = -10 and faces down.
        assert.deepStrictEqual (ZValues (instance).map ((z) => Math.round (z)), [-10]);
        for (let i = 2; i < instance.normals.length; i += 3) {
            assert.ok (Math.abs (instance.normals[i] + 1.0) < 1e-6);
        }
    });
});

describe ('Viewer Overlays Face Highlights', function () {
    function CreateFakeViewer ()
    {
        return {
            faceHighlights : null,
            SetFaceHighlights (prepared) {
                this.faceHighlights = prepared;
            },
            HasFaceHighlights () {
                return this.faceHighlights !== null;
            },
            ClearFaceHighlights () {
                this.faceHighlights = null;
            }
        };
    }

    it ('Fails without a model', function () {
        let overlays = new OV.ViewerOverlays (CreateFakeViewer ());
        assert.strictEqual (overlays.ShowFaceHighlights ([]).reason, 'no model is loaded');
    });

    it ('Keeps the shown faces after a failed call', function () {
        let viewer = CreateFakeViewer ();
        let overlays = new OV.ViewerOverlays (viewer);
        overlays.SetModel (CreateBoxModel ());
        assert.ok (overlays.ShowFaceHighlights ([{ faces : [0], color : '#ff0000' }]).ok);
        let shown = viewer.faceHighlights;
        assert.ok (overlays.HasFaceHighlights ());
        assert.ok (!overlays.ShowFaceHighlights ([{ faces : [9], color : '#ff0000' }]).ok);
        assert.strictEqual (viewer.faceHighlights, shown);
        overlays.ClearFaceHighlights ();
        assert.ok (!overlays.HasFaceHighlights ());
    });
});

}
