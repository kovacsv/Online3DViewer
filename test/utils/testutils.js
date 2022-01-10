import * as OV from '../../source/engine/main.js';
import * as fs from 'fs';
import * as path from 'path';

export function GetTextFileContent (fileName)
{
    var testFilePath = path.join (path.resolve (), 'test', 'testfiles', fileName);
    if (!fs.existsSync (testFilePath)) {
        return null;
    }
    return fs.readFileSync (testFilePath).toString ();
}

export function GetArrayBufferFileContent (fileName)
{
    var testFilePath = path.join (path.resolve (), 'test', 'testfiles', fileName);
    var buffer = fs.readFileSync (testFilePath);
    var arrayBuffer = new ArrayBuffer (buffer.length);
    var uint8Array = new Uint8Array (arrayBuffer);
    var i;
    for (i = 0; i < buffer.length; ++i) {
        uint8Array[i] = buffer[i];
    }
    return arrayBuffer
}

export function ModelNodesToTree (model)
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

export function ModelToObject (model)
{
    var obj = {
        name : model.GetName (),
        materials : [],
        meshes : []
    };

    var i, j;

    var material;
    for (i = 0; i < model.MaterialCount (); i++) {
        material = model.GetMaterial (i);
        obj.materials.push ({
            name : material.name
        });
    }

    var mesh, triangle, meshObj, triangleObj;
    for (i = 0; i < model.MeshCount (); i++) {
        mesh = model.GetMesh (i);
        meshObj = {
            name : mesh.GetName (),
            triangles : []
        };
        for (j = 0; j < mesh.TriangleCount (); j++) {
            triangle = mesh.GetTriangle (j);
            triangleObj = {
                mat : triangle.mat,
                vertices : [],
                normals : [],
                uvs : []
            };
            triangleObj.vertices.push (
                mesh.GetVertex (triangle.v0).x,
                mesh.GetVertex (triangle.v0).y,
                mesh.GetVertex (triangle.v0).z,
                mesh.GetVertex (triangle.v1).x,
                mesh.GetVertex (triangle.v1).y,
                mesh.GetVertex (triangle.v1).z,
                mesh.GetVertex (triangle.v2).x,
                mesh.GetVertex (triangle.v2).y,
                mesh.GetVertex (triangle.v2).z
            );
            triangleObj.normals.push (
                mesh.GetNormal (triangle.n0).x,
                mesh.GetNormal (triangle.n0).y,
                mesh.GetNormal (triangle.n0).z,
                mesh.GetNormal (triangle.n1).x,
                mesh.GetNormal (triangle.n1).y,
                mesh.GetNormal (triangle.n1).z,
                mesh.GetNormal (triangle.n2).x,
                mesh.GetNormal (triangle.n2).y,
                mesh.GetNormal (triangle.n2).z
            );
            if (triangle.HasTextureUVs ()) {
                triangleObj.uvs.push (
                    mesh.GetTextureUV (triangle.u0).x,
                    mesh.GetTextureUV (triangle.u0).y,
                    mesh.GetTextureUV (triangle.u1).x,
                    mesh.GetTextureUV (triangle.u1).y,
                    mesh.GetTextureUV (triangle.u2).x,
                    mesh.GetTextureUV (triangle.u2).y
                );
            }
            meshObj.triangles.push (triangleObj);
        }
        obj.meshes.push (meshObj);
    }

    return obj;
}

export function ModelToObjectSimple (model)
{
    var obj = {
        name : model.GetName (),
        materials : [],
        meshes : []
    };

    var i;

    var material;
    for (i = 0; i < model.MaterialCount (); i++) {
        material = model.GetMaterial (i);
        obj.materials.push ({
            name : material.name
        });
    }

    model.EnumerateTransformedMeshes ((mesh) => {
        let boundingBox = OV.GetBoundingBox (mesh);
        let meshObj = {
            name : mesh.GetName (),
            vertexCount : mesh.VertexCount (),
            vertexColorCount : mesh.VertexColorCount (),
            normalCount : mesh.NormalCount (),
            uvCount : mesh.TextureUVCount (),
            triangleCount : mesh.TriangleCount (),
            boundingBox : {
                min : [boundingBox.min.x, boundingBox.min.y, boundingBox.min.z],
                max : [boundingBox.max.x, boundingBox.max.y, boundingBox.max.z]
            }
        };
        obj.meshes.push (meshObj);
    });

    return obj;
}

export function GetTwoCubesConnectingInOneVertexModel ()
{
    let model = new OV.Model ();

    let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    model.AddMeshToRootNode (cube1);

    let cube2 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    let matrix = new OV.Matrix ().CreateTranslation (1.0, 1.0, 1.0);
    OV.TransformMesh (cube2, new OV.Transformation (matrix));
    model.AddMeshToRootNode (cube2);

    OV.FinalizeModel (model);
    return model;
}

export function GetTwoCubesConnectingInOneEdgeModel ()
{
    let model = new OV.Model ();

    let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    model.AddMeshToRootNode (cube1);

    let cube2 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    let matrix = new OV.Matrix ().CreateTranslation (1.0, 0.0, 1.0);
    OV.TransformMesh (cube2, new OV.Transformation (matrix))
    model.AddMeshToRootNode (cube2);

    OV.FinalizeModel (model);
    return model;
}

export function GetTwoCubesConnectingInOneFaceModel ()
{
    let model = new OV.Model ();

    let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    model.AddMeshToRootNode (cube1);

    let cube2 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
    let matrix = new OV.Matrix ().CreateTranslation (1.0, 0.0, 0.0);
    OV.TransformMesh (cube2, new OV.Transformation (matrix));
    model.AddMeshToRootNode (cube2);

    OV.FinalizeModel (model);
    return model;
}

export function GetCubeWithOneMissingFaceMesh ()
{
    var cube = new OV.Mesh ();
    cube.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    cube.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    cube.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
    cube.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    cube.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
    cube.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
    cube.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
    cube.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
    cube.AddTriangle (new OV.Triangle (0, 1, 5));
    cube.AddTriangle (new OV.Triangle (0, 5, 4));
    cube.AddTriangle (new OV.Triangle (1, 2, 6));
    cube.AddTriangle (new OV.Triangle (1, 6, 5));
    cube.AddTriangle (new OV.Triangle (2, 3, 7));
    cube.AddTriangle (new OV.Triangle (2, 7, 6));
    cube.AddTriangle (new OV.Triangle (3, 0, 4));
    cube.AddTriangle (new OV.Triangle (3, 4, 7));
    cube.AddTriangle (new OV.Triangle (0, 3, 2));
    cube.AddTriangle (new OV.Triangle (0, 2, 1));
    return cube;
}

export function GetTetrahedronMesh ()
{
    var tetrahedron = new OV.Mesh ();

    let a = 1.0;
    tetrahedron.AddVertex (new OV.Coord3D (+a, +a, +a));
    tetrahedron.AddVertex (new OV.Coord3D (-a, -a, +a));
    tetrahedron.AddVertex (new OV.Coord3D (-a, +a, -a));
    tetrahedron.AddVertex (new OV.Coord3D (+a, -a, -a));
    tetrahedron.AddTriangle (new OV.Triangle (0, 1, 3));
    tetrahedron.AddTriangle (new OV.Triangle (0, 2, 1));
    tetrahedron.AddTriangle (new OV.Triangle (0, 3, 2));
    tetrahedron.AddTriangle (new OV.Triangle (1, 2, 3));

    return tetrahedron;
}

export function GetModelWithOneMesh (mesh)
{
    var model = new OV.Model ();
    model.AddMeshToRootNode (mesh);
    OV.FinalizeModel (model);
    return model;
}

export function GetHierarchicalModelNoFinalization ()
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

export function GetTranslatedRotatedCubesModel ()
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

    let rotation = OV.QuaternionFromAxisAngle (new OV.Coord3D (0.0, 0.0, 1.0), Math.PI / 2.0);
    rotatedNode.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateRotation (rotation.x, rotation.y, rotation.z, rotation.w)));

    let translatedRotatedNode = new OV.Node ();
    translatedRotatedNode.SetName ('Translated and Rotated');
    translatedRotatedNode.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0)));
    translatedRotatedNode.AddMeshIndex (0);

    root.AddChildNode (translatedNode);
    root.AddChildNode (rotatedNode);
    rotatedNode.AddChildNode (translatedRotatedNode);

    OV.FinalizeModel (model);
    return model;
}
