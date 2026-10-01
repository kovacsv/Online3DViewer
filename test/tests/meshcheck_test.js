import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { GetCubeWithOneMissingFaceMesh, GetModelWithOneMesh, GetTetrahedronMesh } from '../utils/testutils.js';

export default function suite ()
{

function AppendMesh (targetMesh, sourceMesh, offset)
{
    const vertexOffset = targetMesh.VertexCount ();
    for (let i = 0; i < sourceMesh.VertexCount (); i++) {
        const vertex = sourceMesh.GetVertex (i);
        targetMesh.AddVertex (new OV.Coord3D (vertex.x + offset.x, vertex.y + offset.y, vertex.z + offset.z));
    }
    for (let i = 0; i < sourceMesh.TriangleCount (); i++) {
        const triangle = sourceMesh.GetTriangle (i);
        targetMesh.AddTriangle (new OV.Triangle (triangle.v0 + vertexOffset, triangle.v1 + vertexOffset, triangle.v2 + vertexOffset));
    }
}

function AppendFlippedMesh (targetMesh, sourceMesh, offset, scale)
{
    let scaled = new OV.Mesh ();
    for (let i = 0; i < sourceMesh.VertexCount (); i++) {
        const vertex = sourceMesh.GetVertex (i);
        scaled.AddVertex (new OV.Coord3D (vertex.x * scale, vertex.y * scale, vertex.z * scale));
    }
    for (let i = 0; i < sourceMesh.TriangleCount (); i++) {
        const triangle = sourceMesh.GetTriangle (i);
        scaled.AddTriangle (new OV.Triangle (triangle.v0, triangle.v2, triangle.v1));
    }
    AppendMesh (targetMesh, scaled, offset);
}

function GetFinMesh ()
{
    let mesh = new OV.Mesh ();
    mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    mesh.AddVertex (new OV.Coord3D (0.5, 1.0, 0.0));
    mesh.AddVertex (new OV.Coord3D (0.5, -1.0, 0.0));
    mesh.AddVertex (new OV.Coord3D (0.5, 0.0, 1.0));
    mesh.AddTriangle (new OV.Triangle (0, 1, 2));
    mesh.AddTriangle (new OV.Triangle (1, 0, 3));
    mesh.AddTriangle (new OV.Triangle (0, 1, 4));
    return mesh;
}

function GetGridWithPinchedHoleTriangles ()
{
    // 3x3 quads without the center and one corner quad: the hole and the outer
    // boundary touch in one vertex, so the boundary is a figure-8.
    let triangles = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i === 1 && j === 1) || (i === 0 && j === 0)) {
                continue;
            }
            const v = j * 4 + i;
            triangles.push ([v, v + 1, v + 5]);
            triangles.push ([v, v + 5, v + 4]);
        }
    }
    return triangles;
}

function CreateMesh (vertexCount, getVertex, triangles)
{
    let mesh = new OV.Mesh ();
    for (let i = 0; i < vertexCount; i++) {
        mesh.AddVertex (getVertex (i));
    }
    for (const triangle of triangles) {
        mesh.AddTriangle (new OV.Triangle (triangle[0], triangle[1], triangle[2]));
    }
    return mesh;
}

function GetGridVertex (index)
{
    return new OV.Coord3D (index % 4, Math.floor (index / 4), 0.0);
}

function GetJoinedTetrahedraModel ()
{
    // Two closed tetrahedra in separate meshes sharing the face 0-1-2.
    let model = new OV.Model ();
    let vertices = [
        new OV.Coord3D (0.0, 0.0, 0.0),
        new OV.Coord3D (1.0, 0.0, 0.0),
        new OV.Coord3D (0.0, 1.0, 0.0),
        new OV.Coord3D (0.0, 0.0, 1.0),
        new OV.Coord3D (0.0, 0.0, -1.0)
    ];
    model.AddMeshToRootNode (CreateMesh (5, (i) => vertices[i], [[0, 2, 1], [0, 1, 3], [1, 2, 3], [2, 0, 3]]));
    model.AddMeshToRootNode (CreateMesh (5, (i) => vertices[i], [[0, 1, 2], [0, 4, 1], [1, 4, 2], [2, 4, 0]]));
    OV.FinalizeModel (model);
    return model;
}

function AddMeshWithTransformation (model, mesh, matrix)
{
    const meshIndex = model.AddMesh (mesh);
    let node = new OV.Node ();
    node.SetTransformation (new OV.Transformation (matrix));
    node.AddMeshIndex (meshIndex);
    model.GetRootNode ().AddChildNode (node);
}

function FlipTriangle (triangle)
{
    const tmp = triangle.v1;
    triangle.v1 = triangle.v2;
    triangle.v2 = tmp;
}

function EdgePositionsToStrings (edgePositions)
{
    // Order independent, so the test does not depend on edge direction.
    let result = [];
    for (let i = 0; i < edgePositions.length; i += 6) {
        let points = [
            edgePositions.slice (i, i + 3).join (' '),
            edgePositions.slice (i + 3, i + 6).join (' ')
        ];
        points.sort ();
        result.push (points.join (' - '));
    }
    result.sort ();
    return result;
}

describe ('Mesh Check', function () {
    it ('Closed Cube', function () {
        const result = OV.CheckMesh (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        assert.strictEqual (result.vertexCount, 8);
        assert.strictEqual (result.edgeCount, 18);
        assert.strictEqual (result.triangleCount, 12);
        assert.strictEqual (result.boundaryEdgeCount, 0);
        assert.strictEqual (result.holeCount, 0);
        assert.strictEqual (result.nonManifoldEdgeCount, 0);
        assert.strictEqual (result.nonManifoldVertexCount, 0);
        assert.strictEqual (result.inconsistentEdgeCount, 0);
        assert.strictEqual (result.bodyCount, 1);
        assert.strictEqual (result.eulerCharacteristic, 2);
        assert.ok (result.isWatertight);
        assert.ok (!result.isInsideOut);
    });

    it ('Cube with One Missing Face', function () {
        const result = OV.CheckMesh (GetCubeWithOneMissingFaceMesh ());
        assert.strictEqual (result.boundaryEdgeCount, 4);
        assert.strictEqual (result.holeCount, 1);
        assert.strictEqual (result.nonManifoldEdgeCount, 0);
        assert.strictEqual (result.bodyCount, 1);
        assert.strictEqual (result.eulerCharacteristic, 1);
        assert.ok (!result.isWatertight);
        assert.ok (!result.isInsideOut);
    });

    it ('Two Separate Cubes in One Mesh', function () {
        let mesh = new OV.Mesh ();
        const cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        AppendMesh (mesh, cube, new OV.Coord3D (0.0, 0.0, 0.0));
        AppendMesh (mesh, cube, new OV.Coord3D (2.0, 0.0, 0.0));
        const result = OV.CheckMesh (mesh);
        assert.strictEqual (result.bodyCount, 2);
        assert.strictEqual (result.eulerCharacteristic, 4);
        assert.ok (result.isWatertight);
    });

    it ('Three Triangles Sharing One Edge', function () {
        const result = OV.CheckMesh (GetFinMesh ());
        assert.strictEqual (result.nonManifoldEdgeCount, 1);
        assert.strictEqual (result.boundaryEdgeCount, 6);
        assert.strictEqual (result.holeCount, 1);
        assert.strictEqual (result.nonManifoldVertexCount, 0);
        assert.strictEqual (result.bodyCount, 1);
        assert.ok (!result.isWatertight);
    });

    it ('Two Tetrahedra Touching in One Vertex', function () {
        let mesh = new OV.Mesh ();
        const tetrahedron = GetTetrahedronMesh ();
        AppendMesh (mesh, tetrahedron, new OV.Coord3D (0.0, 0.0, 0.0));
        AppendMesh (mesh, tetrahedron, new OV.Coord3D (2.0, 2.0, 0.0));
        const result = OV.CheckMesh (mesh);
        assert.strictEqual (result.vertexCount, 7);
        assert.strictEqual (result.nonManifoldVertexCount, 1);
        assert.strictEqual (result.nonManifoldEdgeCount, 0);
        assert.strictEqual (result.bodyCount, 2);
        assert.strictEqual (result.eulerCharacteristic, 3);
        assert.ok (result.isWatertight);
    });

    it ('Cube with One Flipped Face', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        FlipTriangle (cube.GetTriangle (0));
        FlipTriangle (cube.GetTriangle (1));
        const result = OV.CheckMesh (cube);
        assert.strictEqual (result.inconsistentEdgeCount, 4);
        assert.ok (result.isWatertight);
        assert.ok (!result.isInsideOut);
    });

    it ('Inside Out Cube', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        OV.FlipMeshTrianglesOrientation (cube);
        const result = OV.CheckMesh (cube);
        assert.strictEqual (result.inconsistentEdgeCount, 0);
        assert.ok (result.isWatertight);
        assert.ok (result.isInsideOut);
    });

    it ('Model with Two Separate Meshes', function () {
        let model = new OV.Model ();
        model.AddMeshToRootNode (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        AddMeshWithTransformation (model, GetCubeWithOneMissingFaceMesh (), new OV.Matrix ().CreateTranslation (2.0, 0.0, 0.0));
        OV.FinalizeModel (model);
        const result = OV.CheckMesh (model);
        assert.strictEqual (result.triangleCount, 22);
        assert.strictEqual (result.bodyCount, 2);
        assert.strictEqual (result.holeCount, 1);
        assert.ok (!result.isWatertight);
    });

    it ('Meshes Sharing a Face Are Checked Together', function () {
        // Each tetrahedron is closed, but together the shared face is inside material.
        const result = OV.CheckMesh (GetJoinedTetrahedraModel ());
        assert.strictEqual (result.vertexCount, 5);
        assert.strictEqual (result.nonManifoldEdgeCount, 3);
        assert.strictEqual (result.boundaryEdgeCount, 0);
        assert.strictEqual (result.bodyCount, 1);
        assert.ok (!result.isWatertight);
    });

    it ('Mesh Split into Two Instances Is Closed', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        let firstHalf = new OV.Mesh ();
        let secondHalf = new OV.Mesh ();
        AppendMesh (firstHalf, cube, new OV.Coord3D (0.0, 0.0, 0.0));
        AppendMesh (secondHalf, cube, new OV.Coord3D (0.0, 0.0, 0.0));
        firstHalf.triangles.splice (6);
        secondHalf.triangles.splice (0, 6);
        let model = new OV.Model ();
        model.AddMeshToRootNode (firstHalf);
        model.AddMeshToRootNode (secondHalf);
        OV.FinalizeModel (model);
        assert.strictEqual (OV.CheckMesh (firstHalf).holeCount, 1);
        const result = OV.CheckMesh (model);
        assert.strictEqual (result.holeCount, 0);
        assert.ok (result.isWatertight);
    });

    it ('Mesh Instance Without Triangles Is Ignored', function () {
        let lines = new OV.Mesh ();
        lines.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        lines.AddVertex (new OV.Coord3D (5.0, 0.0, 0.0));
        lines.AddLine (new OV.Line ([0, 1]));
        let model = new OV.Model ();
        model.AddMeshToRootNode (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        model.AddMeshToRootNode (lines);
        OV.FinalizeModel (model);
        const result = OV.CheckMesh (model);
        assert.strictEqual (result.vertexCount, 8);
        assert.strictEqual (result.holeCount, 0);
        assert.ok (result.isWatertight);
        assert.ok (!OV.CheckMesh (lines).isWatertight);
    });

    it ('Degenerate Triangle Is Skipped', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        const duplicateIndex = cube.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        cube.AddTriangle (new OV.Triangle (0, duplicateIndex, 1));
        const result = OV.CheckMesh (cube);
        assert.strictEqual (result.degenerateTriangleCount, 1);
        assert.strictEqual (result.triangleCount, 12);
        assert.strictEqual (result.holeCount, 0);
        assert.strictEqual (result.nonManifoldEdgeCount, 0);
        assert.strictEqual (result.eulerCharacteristic, 2);
        assert.ok (result.isWatertight);
    });

    it ('Figure-8 Boundary Is One Hole in Any Triangle Order', function () {
        const triangles = GetGridWithPinchedHoleTriangles ();
        for (let shift = 0; shift < triangles.length; shift++) {
            const shifted = triangles.slice (shift).concat (triangles.slice (0, shift));
            for (const order of [shifted, shifted.slice ().reverse ()]) {
                const result = OV.CheckMesh (CreateMesh (16, GetGridVertex, order));
                assert.strictEqual (result.boundaryEdgeCount, 16);
                assert.strictEqual (result.nonManifoldVertexCount, 1);
                assert.strictEqual (result.holeCount, 1);
            }
        }
    });

    it ('Open Boundary Chain Ending at Non-Manifold Vertices Is One Hole', function () {
        // A quad fin on an edge of a closed tetrahedron: its boundary 1-5-4-0 ends where the
        // non-manifold edge 0-1 starts. Fin first puts the middle boundary edge first.
        let vertices = [
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (1.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 1.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0),
            new OV.Coord3D (0.0, -1.0, -1.0),
            new OV.Coord3D (1.0, -1.0, -1.0)
        ];
        const tetrahedron = [[0, 2, 1], [0, 1, 3], [1, 2, 3], [2, 0, 3]];
        const fin = [[0, 5, 4], [0, 1, 5]];
        for (const triangles of [fin.concat (tetrahedron), tetrahedron.concat (fin), fin.slice ().reverse ().concat (tetrahedron)]) {
            const result = OV.CheckMesh (CreateMesh (6, (i) => vertices[i], triangles));
            assert.strictEqual (result.boundaryEdgeCount, 3);
            assert.strictEqual (result.nonManifoldEdgeCount, 1);
            assert.strictEqual (result.holeCount, 1);
        }
    });

    it ('Empty Mesh', function () {
        const result = OV.CheckMesh (new OV.Mesh ());
        assert.strictEqual (result.triangleCount, 0);
        assert.strictEqual (result.bodyCount, 0);
        assert.strictEqual (result.holeCount, 0);
        assert.ok (!result.isWatertight);
        assert.ok (!result.isInsideOut);
    });

    it ('Closed Model', function () {
        const result = OV.CheckMesh (GetModelWithOneMesh (GetTetrahedronMesh ()));
        assert.strictEqual (result.eulerCharacteristic, 2);
        assert.ok (result.isWatertight);
        assert.ok (!result.isInsideOut);
    });
});

describe ('Mesh Check Inside Out', function () {
    it ('Cavity Is Not Inside Out', function () {
        let mesh = new OV.Mesh ();
        AppendMesh (mesh, OV.GenerateCuboid (null, 3.0, 3.0, 3.0), new OV.Coord3D (0.0, 0.0, 0.0));
        AppendFlippedMesh (mesh, OV.GenerateCuboid (null, 1.0, 1.0, 1.0), new OV.Coord3D (1.0, 1.0, 1.0), 1.0);
        const result = OV.CheckMesh (mesh);
        assert.strictEqual (result.bodyCount, 2);
        assert.ok (result.isWatertight);
        assert.ok (!result.isInsideOut);
    });

    it ('Separate Inverted Body Is Inside Out', function () {
        let mesh = new OV.Mesh ();
        AppendMesh (mesh, OV.GenerateCuboid (null, 3.0, 3.0, 3.0), new OV.Coord3D (0.0, 0.0, 0.0));
        AppendFlippedMesh (mesh, OV.GenerateCuboid (null, 1.0, 1.0, 1.0), new OV.Coord3D (5.0, 0.0, 0.0), 1.0);
        const result = OV.CheckMesh (mesh);
        assert.ok (OV.CalculateVolume (mesh) > 0.0);
        assert.ok (result.isInsideOut);
    });

    it ('Inverted Body with Cavity Is Inside Out', function () {
        let mesh = new OV.Mesh ();
        AppendFlippedMesh (mesh, OV.GenerateCuboid (null, 1.0, 1.0, 1.0), new OV.Coord3D (0.0, 0.0, 0.0), 3.0);
        AppendMesh (mesh, OV.GenerateCuboid (null, 1.0, 1.0, 1.0), new OV.Coord3D (1.0, 1.0, 1.0));
        assert.ok (OV.CheckMesh (mesh).isInsideOut);
    });

    it ('Mirrored Mesh Instance Is Not Inside Out', function () {
        let model = new OV.Model ();
        AddMeshWithTransformation (model, OV.GenerateCuboid (null, 1.0, 1.0, 1.0), new OV.Matrix ().CreateScale (-1.0, 1.0, 1.0));
        OV.FinalizeModel (model);
        const result = OV.CheckMesh (model);
        assert.strictEqual (result.inconsistentEdgeCount, 0);
        assert.ok (result.isWatertight);
        assert.ok (!result.isInsideOut);
        let meshInstance = null;
        model.EnumerateMeshInstances ((instance) => {
            meshInstance = instance;
        });
        assert.ok (!OV.CheckMesh (meshInstance).isInsideOut);
    });

    it ('Mirrored Inverted Mesh Instance Is Inside Out', function () {
        let cube = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        OV.FlipMeshTrianglesOrientation (cube);
        let model = new OV.Model ();
        AddMeshWithTransformation (model, cube, new OV.Matrix ().CreateScale (-1.0, 1.0, 1.0));
        OV.FinalizeModel (model);
        assert.ok (OV.CheckMesh (model).isInsideOut);
    });
});

describe ('Mesh Check Problem Edges', function () {
    it ('Closed Cube Has No Problem Edges', function () {
        const result = OV.CheckMesh (OV.GenerateCuboid (null, 1.0, 1.0, 1.0));
        assert.strictEqual (result.boundaryEdgePositions.length, 0);
        assert.strictEqual (result.nonManifoldEdgePositions.length, 0);
    });

    it ('Cube with One Missing Face Has Its Rim as Boundary Edges', function () {
        const result = OV.CheckMesh (GetCubeWithOneMissingFaceMesh ());
        assert.strictEqual (result.nonManifoldEdgePositions.length, 0);
        assert.deepStrictEqual (EdgePositionsToStrings (result.boundaryEdgePositions), [
            '0 0 1 - 0 1 1',
            '0 0 1 - 1 0 1',
            '0 1 1 - 1 1 1',
            '1 0 1 - 1 1 1'
        ]);
    });

    it ('Fin Has One Non-Manifold Edge', function () {
        const result = OV.CheckMesh (GetFinMesh ());
        assert.deepStrictEqual (EdgePositionsToStrings (result.nonManifoldEdgePositions), ['0 0 0 - 1 0 0']);
        assert.strictEqual (result.boundaryEdgePositions.length, 6 * 6);
    });

    it ('Problem Edges Respect Mesh Instance Transformation', function () {
        let model = new OV.Model ();
        model.AddMesh (GetCubeWithOneMissingFaceMesh ());
        let node = new OV.Node ();
        node.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (10.0, 0.0, 0.0)));
        node.AddMeshIndex (0);
        model.GetRootNode ().AddChildNode (node);
        OV.FinalizeModel (model);
        const result = OV.CheckMesh (model);
        assert.strictEqual (result.boundaryEdgeCount, 4);
        assert.deepStrictEqual (EdgePositionsToStrings (result.boundaryEdgePositions), [
            '10 0 1 - 10 1 1',
            '10 0 1 - 11 0 1',
            '10 1 1 - 11 1 1',
            '11 0 1 - 11 1 1'
        ]);
    });
});

}
