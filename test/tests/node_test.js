var assert = require ('assert');

describe ('Node', function() {
    it ('Default Initialization', function () {
        let node = new OV.Node ();
        assert.strictEqual (node.GetName (), '');
        assert.deepStrictEqual (node.GetChildNodes (), []);
        assert.deepStrictEqual (node.GetMeshIndices (), []);
    });

    it ('Set Name', function () {
        let node = new OV.Node ();
        node.SetName ('New Name');
        assert.strictEqual (node.GetName (), 'New Name');
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
});
