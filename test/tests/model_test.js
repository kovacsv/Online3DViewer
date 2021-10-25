var assert = require ('assert');

describe ('Model', function () {
    it ('Default Initialization', function () {
        var model = new OV.Model ();
        assert.strictEqual (model.MaterialCount (), 0);
        assert.strictEqual (model.MeshCount (), 0);
    });

    it ('Add Material', function () {
        var model = new OV.Model ();
        var material = new OV.Material (OV.MaterialType.Phong);
        material.name = 'example';
        var index = model.AddMaterial (material);
        assert.strictEqual (model.MaterialCount (), 1);
        var theMaterial = model.GetMaterial (index);
        assert.strictEqual (theMaterial.name, 'example');
    });

    it ('Add Mesh', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();
        mesh.SetName ('example');
        var index = model.AddMesh (mesh);
        assert.strictEqual (model.MeshCount (), 1);
        var theMesh = model.GetMesh (index);
        assert.strictEqual (theMesh.GetName (), 'example');
    });

    it ('Add Mesh To Index', function () {
        var model = new OV.Model ();
        var mesh1 = new OV.Mesh ();
        var mesh2 = new OV.Mesh ();
        var mesh3 = new OV.Mesh ();
        var mesh4 = new OV.Mesh ();
        mesh1.SetName ('A');
        mesh2.SetName ('B');
        mesh3.SetName ('C');
        mesh4.SetName ('D');
        model.AddMesh (mesh1);
        model.AddMesh (mesh2);
        model.AddMeshToIndex (mesh3, 1);
        model.AddMeshToIndex (mesh4, 3);
        assert.strictEqual (model.GetMesh (0).GetName (), 'A');
        assert.strictEqual (model.GetMesh (1).GetName (), 'C');
        assert.strictEqual (model.GetMesh (2).GetName (), 'B');
        assert.strictEqual (model.GetMesh (3).GetName (), 'D');
    });

    it ('Counters', function () {
        var model = new OV.Model ();
        let mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddTextureUV (new OV.Coord2D (0.0, 0.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh);
        assert.strictEqual (model.VertexCount (), 3);
        assert.strictEqual (model.NormalCount (), 2);
        assert.strictEqual (model.TextureUVCount (), 1);
        assert.strictEqual (model.TriangleCount (), 4);
    });

    it ('Remove Mesh', function () {
        var model = new OV.Model ();
        
        let mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        let mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        assert.strictEqual (model.MeshCount (), 2);
        assert.strictEqual (model.VertexCount (), 6);
        assert.strictEqual (model.TriangleCount (), 2);

        model.RemoveMesh (0);
        assert.strictEqual (model.MeshCount (), 1);
        assert.strictEqual (model.VertexCount (), 3);
        assert.strictEqual (model.TriangleCount (), 1);

        model.RemoveMesh (0);
        assert.strictEqual (model.MeshCount (), 0);
        assert.strictEqual (model.VertexCount (), 0);
        assert.strictEqual (model.TriangleCount (), 0);
    });    
});

describe ('Model Finalization', function () {
    it ('Calculate Normal', function () {
        var mesh = new OV.Mesh ();
        var v0 = mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        var v1 = mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        var v2 = mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        var triangleIndex = mesh.AddTriangle (new OV.Triangle (v0, v1, v2));
        var model = new OV.Model ();
        var meshIndex = model.AddMesh (mesh);
        assert.strictEqual (model.MaterialCount (), 0);
        OV.FinalizeModel (model, function () { return new OV.Material (OV.MaterialType.Phong) });
        assert.strictEqual (model.MaterialCount (), 1);
        var theMesh = model.GetMesh (meshIndex);
        assert.strictEqual (theMesh.NormalCount (), 1);
        var triangle = theMesh.GetTriangle (triangleIndex);
        assert.strictEqual (triangle.n0, 0);
        assert.strictEqual (triangle.n1, 0);
        assert.strictEqual (triangle.n2, 0);
        assert.strictEqual (triangle.mat, 0);
    });

    it ('Calculate Curved Normal', function () {
        var mesh = new OV.Mesh ();
        var v0 = mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        var v1 = mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        var v2 = mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        var v3 = mesh.AddVertex (new OV.Coord3D (0.0, 0.0, -1.0));

        var triangle1 = new OV.Triangle (v0, v1, v2);
        triangle1.curve = 1;
        var triangle2 = new OV.Triangle (v0, v3, v1);
        triangle2.curve = 1;

        var triangle1 = mesh.AddTriangle (triangle1);
        var triangle1 = mesh.AddTriangle (triangle2);

        var model = new OV.Model ()
        var meshIndex = model.AddMesh (mesh);

        OV.FinalizeModel (model, function () { return new OV.Material (OV.MaterialType.Phong) });
        
        var theMesh = model.GetMesh (meshIndex);
        assert.strictEqual (theMesh.NormalCount (), 6);
        
        var normal = theMesh.GetNormal (0);
        assert.strictEqual (normal.x, 0.0);
        assert.strictEqual (normal.y, -0.7071067811865475);
        assert.strictEqual (normal.z, 0.7071067811865475);
    });

    it ('Calculate Curved Normal 2', function () {
        var mesh = new OV.Mesh ();
        var v0 = mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        var v1 = mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        var v2 = mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        var v3 = mesh.AddVertex (new OV.Coord3D (0.0, 0.0, -1.0));
        var v4 = mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));

        var triangle1 = new OV.Triangle (v0, v1, v2);
        triangle1.curve = 1;
        var triangle2 = new OV.Triangle (v0, v2, v4);
        triangle2.curve = 1;
        var triangle3 = new OV.Triangle (v0, v3, v1);
        triangle3.curve = 1;

        mesh.AddTriangle (triangle1);
        mesh.AddTriangle (triangle2);
        mesh.AddTriangle (triangle3);

        var model = new OV.Model ()
        var meshIndex = model.AddMesh (mesh);

        OV.FinalizeModel (model, function () { return new OV.Material (OV.MaterialType.Phong) });
        
        var theMesh = model.GetMesh (meshIndex);
        assert.strictEqual (theMesh.NormalCount (), 9);
        
        var normal = theMesh.GetNormal (0);
        assert.strictEqual (normal.x, 0.0);
        assert.strictEqual (normal.y, -0.7071067811865475);
        assert.strictEqual (normal.z, 0.7071067811865475);
    });    
});

describe ('Color Conversion', function () {
    it ('Color equality check', function () {
        assert (OV.ColorIsEqual (new OV.Color (10, 20, 30), new OV.Color (10, 20, 30)));
        assert (!OV.ColorIsEqual (new OV.Color (10, 20, 30), new OV.Color (11, 20, 30)));
        assert (!OV.ColorIsEqual (new OV.Color (10, 20, 30), new OV.Color (10, 21, 30)));
        assert (!OV.ColorIsEqual (new OV.Color (10, 20, 30), new OV.Color (10, 20, 31)));
    });

    it ('Color hex string conversion', function () {
        let color = new OV.Color (10, 20, 30);
        let hexString = '0a141e';
        assert.strictEqual (OV.ColorToHexString (color), hexString);
        assert.deepStrictEqual (OV.HexStringToColor (hexString), color);
    });
});

function CreateHierarchicalModel ()
{
    /*
        + <Root>
            + Node 1
                + Node 3
                    Mesh 5
                    Mesh 6
                    Mesh 7
                + Node 4
                    Mesh 7
                Mesh 3
                Mesh 4
            + Node 2
            Mesh 1
            Mesh 2
    */

    let model = new OV.Model ();
    let root = model.GetRootNode ();

    let node1 = new OV.Node ();
    node1.SetName ('Node 1');

    let node2 = new OV.Node ();
    node2.SetName ('Node 2');

    let node3 = new OV.Node ();
    node3.SetName ('Node 3');

    let node4 = new OV.Node ();
    node4.SetName ('Node 4');

    root.AddChildNode (node1);
    root.AddChildNode (node2);
    node1.AddChildNode (node3);
    node1.AddChildNode (node4);

    let mesh1 = new OV.Mesh ();
    mesh1.SetName ('Mesh 1');

    let mesh2 = new OV.Mesh ();
    mesh2.SetName ('Mesh 2');

    let mesh3 = new OV.Mesh ();
    mesh3.SetName ('Mesh 3');

    let mesh4 = new OV.Mesh ();
    mesh4.SetName ('Mesh 4');

    let mesh5 = new OV.Mesh ();
    mesh5.SetName ('Mesh 5');

    let mesh6 = new OV.Mesh ();
    mesh6.SetName ('Mesh 6');

    let mesh7 = new OV.Mesh ();
    mesh7.SetName ('Mesh 7');

    let mesh1Ind = model.AddMesh (mesh1);
    let mesh2Ind = model.AddMesh (mesh2);
    let mesh3Ind = model.AddMesh (mesh3);
    let mesh4Ind = model.AddMesh (mesh4);
    let mesh5Ind = model.AddMesh (mesh5);
    let mesh6Ind = model.AddMesh (mesh6);
    let mesh7Ind = model.AddMesh (mesh7);

    root.AddMeshIndex (mesh1Ind);
    root.AddMeshIndex (mesh2Ind);
    node1.AddMeshIndex (mesh3Ind);
    node1.AddMeshIndex (mesh4Ind);
    node3.AddMeshIndex (mesh5Ind);
    node3.AddMeshIndex (mesh6Ind);
    node3.AddMeshIndex (mesh7Ind);
    node4.AddMeshIndex (mesh7Ind);

    return model;
}

function CreateTranslatedRotatedCubesModel ()
{
    /*
        + <Root>
            + Translated
                Cube
            + Rotated
                + Translated and Rotated
                    Cube
            Cube
    */

    let model = new OV.Model ();

    let mesh = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    mesh.SetName ('Cube');
    let meshIndex = model.AddMesh (mesh);

    let root = model.GetRootNode ();
    root.AddMeshIndex (0);

    let translatedNode = new OV.Node ();
    translatedNode.SetName ('Translated');
    translatedNode.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0)));
    translatedNode.AddMeshIndex (0);

    let rotatedNode = new OV.Node ();
    rotatedNode.SetName ('Rotated');
    rotatedNode.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateRotation (0.0, 0.0, 0.7071067811865475, 0.7071067811865476)));

    let translatedRotatedNode = new OV.Node ();
    translatedRotatedNode.SetName ('Translated and Rotated');
    translatedRotatedNode.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0)));
    translatedRotatedNode.AddMeshIndex (0);

    root.AddChildNode (translatedNode);
    root.AddChildNode (rotatedNode);
    rotatedNode.AddChildNode (translatedRotatedNode);

    return model;
}

function GetModelTree (model)
{
    function AddNodeToModelTree (model, node, modelTree)
    {
        modelTree.name = node.HasParent () ? node.GetName () : '<Root>';
        modelTree.childNodes = [];
        for (const childNode of node.GetChildNodes ()) {
            let childTree = {};
            AddNodeToModelTree (model, childNode, childTree);
            modelTree.childNodes.push (childTree);
        }
        modelTree.meshNames = [];
        for (const meshIndex of node.GetMeshIndices ()) {
            modelTree.meshNames.push (model.GetMesh (meshIndex).GetName ());
        }
    }

    let modelTree = {};
    let root = model.GetRootNode ();
    AddNodeToModelTree (model, root, modelTree);
    return modelTree;
}

describe ('Node Hierarchy', function () {
    it ('Enumerate hierarchy', function () {
        let model = CreateHierarchicalModel ();
        let modelTree = GetModelTree (model);
        assert.deepStrictEqual (modelTree, {
            name : '<Root>',
            childNodes : [
                {
                    name : 'Node 1',
                    childNodes : [
                        {
                            name : 'Node 3',
                            childNodes : [],
                            meshNames : ['Mesh 5', 'Mesh 6', 'Mesh 7']
                        },
                        {
                            name : 'Node 4',
                            childNodes : [],
                            meshNames : ['Mesh 7']
                        }
                    ],
                    meshNames : ['Mesh 3', 'Mesh 4']
                },
                {
                    name : 'Node 2',
                    childNodes : [],
                    meshNames : []
                }                
            ],
            meshNames : ['Mesh 1', 'Mesh 2']
        });
    });

    it ('Remove mesh', function () {
        let model = CreateHierarchicalModel ();
        model.RemoveMesh (2);
        let modelTree = GetModelTree (model);
        assert.deepStrictEqual (modelTree, {
            name : '<Root>',
            childNodes : [
                {
                    name : 'Node 1',
                    childNodes : [
                        {
                            name : 'Node 3',
                            childNodes : [],
                            meshNames : ['Mesh 5', 'Mesh 6', 'Mesh 7']
                        },
                        {
                            name : 'Node 4',
                            childNodes : [],
                            meshNames : ['Mesh 7']
                        }
                    ],
                    meshNames : ['Mesh 4']
                },
                {
                    name : 'Node 2',
                    childNodes : [],
                    meshNames : []
                }                
            ],
            meshNames : ['Mesh 1', 'Mesh 2']
        });
    });

    it ('Add mesh to index', function () {
        let model = CreateHierarchicalModel ();
        let mesh = new OV.Mesh ();
        mesh.SetName ('Mesh 8');
        model.AddMeshToIndex (mesh, 3);
        let modelTree = GetModelTree (model);
        assert.deepStrictEqual (modelTree, {
            name : '<Root>',
            childNodes : [
                {
                    name : 'Node 1',
                    childNodes : [
                        {
                            name : 'Node 3',
                            childNodes : [],
                            meshNames : ['Mesh 5', 'Mesh 6', 'Mesh 7']
                        },
                        {
                            name : 'Node 4',
                            childNodes : [],
                            meshNames : ['Mesh 7']
                        }
                    ],
                    meshNames : ['Mesh 3', 'Mesh 4']
                },
                {
                    name : 'Node 2',
                    childNodes : [],
                    meshNames : []
                }                
            ],
            meshNames : ['Mesh 1', 'Mesh 2']
        });
    });

    it ('Enumerate mesh instances', function () {
        let model = CreateTranslatedRotatedCubesModel ();
        let modelTree = GetModelTree (model);
        assert.deepStrictEqual (modelTree, {
            name : '<Root>',
            childNodes : [
                {
                    name : 'Translated',
                    childNodes : [],
                    meshNames : ['Cube']
                },
                {
                    name : 'Rotated',
                    childNodes : [
                        {
                            name : 'Translated and Rotated',
                            childNodes : [],
                            meshNames : ['Cube']
                        }
                    ],
                    meshNames : []
                }                
            ],
            meshNames : ['Cube']
        });

        let meshInstances = [];
        model.EnumerateMeshInstances ((meshInstance) => {
            meshInstances.push (meshInstance);
        });

        assert.strictEqual (meshInstances.length, 3);

        let boundingBox1 = OV.GetBoundingBox (meshInstances[0]);
        let boundingBox2 = OV.GetBoundingBox (meshInstances[1]);
        let boundingBox3 = OV.GetBoundingBox (meshInstances[2]);

        assert (OV.CoordIsEqual3D (boundingBox1.min, new OV.Coord3D (2.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox1.max, new OV.Coord3D (3.0, 1.0, 1.0)));

        assert (OV.CoordIsEqual3D (boundingBox2.min, new OV.Coord3D (-1.0, 2.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox2.max, new OV.Coord3D (0.0, 3.0, 1.0)));

        assert (OV.CoordIsEqual3D (boundingBox3.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox3.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });

    it ('Enumerate transformed mesh instances', function () {
        let model = CreateTranslatedRotatedCubesModel ();
        let modelTree = GetModelTree (model);
        assert.deepStrictEqual (modelTree, {
            name : '<Root>',
            childNodes : [
                {
                    name : 'Translated',
                    childNodes : [],
                    meshNames : ['Cube']
                },
                {
                    name : 'Rotated',
                    childNodes : [
                        {
                            name : 'Translated and Rotated',
                            childNodes : [],
                            meshNames : ['Cube']
                        }
                    ],
                    meshNames : []
                }                
            ],
            meshNames : ['Cube']
        });

        let meshes = [];
        model.EnumerateTransformedMeshInstances ((mesh) => {
            meshes.push (mesh);
        });

        assert.strictEqual (meshes.length, 3);

        let boundingBox1 = OV.GetBoundingBox (meshes[0]);
        let boundingBox2 = OV.GetBoundingBox (meshes[1]);
        let boundingBox3 = OV.GetBoundingBox (meshes[2]);

        assert (OV.CoordIsEqual3D (boundingBox1.min, new OV.Coord3D (2.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox1.max, new OV.Coord3D (3.0, 1.0, 1.0)));

        assert (OV.CoordIsEqual3D (boundingBox2.min, new OV.Coord3D (-1.0, 2.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox2.max, new OV.Coord3D (0.0, 3.0, 1.0)));

        assert (OV.CoordIsEqual3D (boundingBox3.min, new OV.Coord3D (0.0, 0.0, 0.0)));
        assert (OV.CoordIsEqual3D (boundingBox3.max, new OV.Coord3D (1.0, 1.0, 1.0)));
    });    
});
