import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Node', function() {
    it ('Default Initialization', function () {
        let node = new OV.Node ();
        assert.strictEqual (node.GetName (), '');
        assert.deepStrictEqual (node.GetChildNodes (), []);
        assert.deepStrictEqual (node.GetMeshIndices (), []);
    });

    it ('Is Empty', function () {
        let node = new OV.Node ();
        assert.ok (node.IsEmpty ());
        node.AddMeshIndex (0);
        assert.ok (!node.IsEmpty ());

        let node2 = new OV.Node ();
        assert.ok (node2.IsEmpty ());
        node2.AddChildNode (new OV.Node ());
        assert.ok (!node2.IsEmpty ());
    });

    it ('Set Name', function () {
        let node = new OV.Node ();
        node.SetName ('New Name');
        assert.strictEqual (node.GetName (), 'New Name');
    });

    it ('Set Transformation', function () {
        let node = new OV.Node ();
        assert.ok (node.GetTransformation ().IsIdentity ());
        let tr = new OV.Transformation (new OV.Matrix ().CreateScale (3.0, 4.0, 5.0));
        node.SetTransformation (tr);
        assert.ok (!node.GetTransformation ().IsIdentity ());
    });

    it ('Add Mesh Indices', function () {
        let node = new OV.Node ();
        node.AddMeshIndex (0);
        node.AddMeshIndex (4);
        node.AddMeshIndex (8);
        assert.deepStrictEqual (node.GetMeshIndices (), [0, 4, 8]);
    });

    it ('Add Child Node', function () {
        let node = new OV.Node ();
        let child1 = new OV.Node ();
        let child2 = new OV.Node ();
        child1.SetName ('Child 1');
        child2.SetName ('Child 2');
        node.AddChildNode (child1);
        node.AddChildNode (child2);
        assert.strictEqual (node.GetChildNodes ().length, 2);
        assert.strictEqual (node.GetChildNodes ()[0].GetName (), 'Child 1');
        assert.strictEqual (node.GetChildNodes ()[1].GetName (), 'Child 2');
        assert.strictEqual (node.GetChildNodes ()[0].GetParent (), node);
        assert.strictEqual (node.GetChildNodes ()[1].GetParent (), node);
    });

    it ('Recursive Enumeration', function () {
        let node = new OV.Node ();
        let child1 = new OV.Node ();
        let child2 = new OV.Node ();
        let child11 = new OV.Node ();
        let child12 = new OV.Node ();

        node.AddChildNode (child1);
        node.AddChildNode (child2);

        child1.AddChildNode (child11);
        child1.AddChildNode (child12);

        let enumerated = [];
        node.Enumerate ((child) => {
            enumerated.push (child);
        });
        assert.deepStrictEqual (enumerated, [node, child1, child11, child12, child2]);

        let enumeratedChildren = [];
        node.EnumerateChildren ((child) => {
            enumeratedChildren.push (child);
        });
        assert.deepStrictEqual (enumeratedChildren, [child1, child11, child12, child2]);
    });

    it ('Recursive Mesh Index Enumeration', function () {
        let node = new OV.Node ();
        let child1 = new OV.Node ();
        let child2 = new OV.Node ();
        let child11 = new OV.Node ();
        let child12 = new OV.Node ();

        node.AddChildNode (child1);
        node.AddChildNode (child2);
        node.AddMeshIndex (1);
        node.AddMeshIndex (2);

        child1.AddChildNode (child11);
        child1.AddChildNode (child12);
        child1.AddMeshIndex (3);
        child2.AddMeshIndex (4);

        child11.AddMeshIndex (5);
        child12.AddMeshIndex (6);

        let enumerated = [];
        node.EnumerateMeshIndices ((meshIndex) => {
            enumerated.push (meshIndex);
        });

        assert.deepStrictEqual (enumerated, [1, 2, 3, 5, 6, 4]);
    });

    it ('World Transformation', function () {

        let rotation = OV.QuaternionFromAxisAngle (new OV.Coord3D (0.0, 0.0, 1.0), Math.PI / 2.0);
        let tr1 = new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0));
        let tr2 = new OV.Transformation (new OV.Matrix ().CreateRotation (rotation.x, rotation.y, rotation.z, rotation.w));
        let tr3 = new OV.Transformation (new OV.Matrix ().CreateTranslation (0.0, 0.0, 2.0));

        let refTr = new OV.Transformation ().Append (tr3).Append (tr2).Append (tr1);

        let node1 = new OV.Node ();
        node1.SetTransformation (tr1);

        let node2 = new OV.Node ();
        node2.SetTransformation (tr2);

        let node3 = new OV.Node ();
        node3.SetTransformation (tr3);

        node1.AddChildNode (node2);
        node2.AddChildNode (node3);

        let nodeTr = node3.GetWorldTransformation ();
        assert.ok (OV.TransformationIsEqual (node1.GetTransformation (), tr1));
        assert.ok (OV.TransformationIsEqual (node2.GetTransformation (), tr2));
        assert.ok (OV.TransformationIsEqual (node3.GetTransformation (), tr3));
        assert.ok (OV.TransformationIsEqual (nodeTr, refTr));
    });

    it ('Id Generator', function () {
        let node1 = new OV.Node ();
        let node2 = new OV.Node ();
        let node3 = new OV.Node ();
        let node4 = new OV.Node ();

        assert.strictEqual (node1.GetId (), 0);
        assert.strictEqual (node2.GetId (), 0);
        assert.strictEqual (node3.GetId (), 0);
        assert.strictEqual (node4.GetId (), 0);

        node1.AddChildNode (node2);
        assert.strictEqual (node2.GetId (), 1);

        node2.AddChildNode (node3);
        assert.strictEqual (node3.GetId (), 2);

        node1.AddChildNode (node4);
        assert.strictEqual (node4.GetId (), 3);
    });
});

}
