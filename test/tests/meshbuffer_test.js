import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Mesh Buffer', function () {
    it ('Mesh To Buffer Simple', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetNormals (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 2, 3).SetNormals (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6).SetNormals (0, 0, 0).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7).SetNormals (0, 0, 0).SetMaterial (1));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 2);
        assert.strictEqual (buffer.primitives[0].indices.length, 6);
        assert.strictEqual (buffer.primitives[0].vertices.length, 4 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 4 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
        assert.strictEqual (buffer.primitives[1].indices.length, 6);
        assert.strictEqual (buffer.primitives[1].vertices.length, 4 * 3);
        assert.strictEqual (buffer.primitives[1].normals.length, 4 * 3);
        assert.strictEqual (buffer.primitives[1].uvs.length, 0);
    });

    it ('Mesh To Buffer Different Colors', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));

        mesh.AddVertexColor (new OV.Color (0.1, 0.0, 0.0));
        mesh.AddVertexColor (new OV.Color (0.2, 0.0, 0.0));

        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetVertexColors (0, 0, 0).SetNormals (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 2, 3).SetVertexColors (1, 1, 1).SetNormals (0, 0, 0).SetMaterial (0));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 6);
        assert.strictEqual (buffer.primitives[0].vertices.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
    });

    it ('Mesh To Buffer Different Normals', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, -1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetNormals (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 2, 3).SetNormals (1, 1, 1).SetMaterial (0));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 6);
        assert.strictEqual (buffer.primitives[0].vertices.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
    });

    it ('Mesh To Buffer Different UVs', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddTextureUV (new OV.Coord3D (1.0, 1.0));
        mesh.AddTextureUV (new OV.Coord3D (-1.0, -1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetNormals (0, 0, 0).SetTextureUVs (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 2, 3).SetNormals (0, 0, 0).SetTextureUVs (1, 1, 1).SetMaterial (0));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 6);
        assert.strictEqual (buffer.primitives[0].vertices.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 6 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 6 * 2);
    });

    it ('Mesh To Buffer Same Normals and UVs', function () {
        var mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddNormal (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddTextureUV (new OV.Coord3D (1.0, 1.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetNormals (0, 0, 0).SetTextureUVs (0, 0, 0).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 2, 3).SetNormals (0, 0, 0).SetTextureUVs (0, 0, 0).SetMaterial (0));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 6);
        assert.strictEqual (buffer.primitives[0].vertices.length, 4 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 4 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 4 * 2);
    });

    it ('Mesh To Buffer Cube', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));

        mesh.AddNormal (new OV.Coord3D (0, -1, 0));
        mesh.AddNormal (new OV.Coord3D (1, 0, 0));
        mesh.AddNormal (new OV.Coord3D (0, 1, 0));
        mesh.AddNormal (new OV.Coord3D (-1, 0, 0));
        mesh.AddNormal (new OV.Coord3D (0, 0, -1));
        mesh.AddNormal (new OV.Coord3D (0, 0, 1));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5).SetNormals (0, 0, 0));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4).SetNormals (0, 0, 0));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6).SetNormals (1, 1, 1));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5).SetNormals (1, 1, 1));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7).SetNormals (2, 2, 2));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6).SetNormals (2, 2, 2));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4).SetNormals (3, 3, 3));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7).SetNormals (3, 3, 3));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2).SetNormals (4, 4, 4));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1).SetNormals (4, 4, 4));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6).SetNormals (5, 5, 5));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7).SetNormals (5, 5, 5));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 36);
        assert.strictEqual (buffer.primitives[0].vertices.length, 24 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 24 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
    });

    it ('Mesh To Buffer Cube Auto Normals', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 36);
        assert.strictEqual (buffer.primitives[0].vertices.length, 24 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 24 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
        assert.strictEqual (buffer.primitives[0].GetByteLength (2, 4), 36 * 2 + 2 * 24 * 3 * 4);
        assert.strictEqual (buffer.GetByteLength (2, 4), 36 * 2 + 2 * 24 * 3 * 4);
    });

    it ('Mesh To Buffer Cube Auto Curve Normals', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6).SetCurve (1));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7).SetCurve (1));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 36);
        assert.strictEqual (buffer.primitives[0].vertices.length, 8 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 8 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
        assert.strictEqual (buffer.primitives[0].GetByteLength (2, 4), 36 * 2 + 2 * 8 * 3 * 4);
        assert.strictEqual (buffer.GetByteLength (2, 4), 36 * 2 + 2 * 8 * 3 * 4);
    });

    it ('Mesh To Buffer Cube Materials', function () {
        var model = new OV.Model ();
        model.AddMaterial (new OV.PhongMaterial ());
        model.AddMaterial (new OV.PhongMaterial ());
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6).SetMaterial (0));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6).SetMaterial (1));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7).SetMaterial (1));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 2);
        assert.strictEqual (buffer.primitives[0].indices.length, 18);
        assert.strictEqual (buffer.primitives[0].vertices.length, 12 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 12 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 0);
        assert.strictEqual (buffer.primitives[0].GetByteLength (2, 4), 18 * 2 + 2 * 12 * 3 * 4);
        assert.strictEqual (buffer.primitives[1].indices.length, 18);
        assert.strictEqual (buffer.primitives[1].vertices.length, 12 * 3);
        assert.strictEqual (buffer.primitives[1].normals.length, 12 * 3);
        assert.strictEqual (buffer.primitives[1].uvs.length, 0);
        assert.strictEqual (buffer.primitives[1].GetByteLength (2, 4), 18 * 2 + 2 * 12 * 3 * 4);
        assert.strictEqual (buffer.GetByteLength (2, 4), 36 * 2 + 2 * 24 * 3 * 4);
    });

    it ('Mesh To Buffer Cube One UV', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
        mesh.AddTextureUV (new OV.Coord2D (0.0, 0.0));
        mesh.AddTextureUV (new OV.Coord2D (1.0, 0.0));
        mesh.AddTextureUV (new OV.Coord2D (1.0, 1.0));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 36);
        assert.strictEqual (buffer.primitives[0].vertices.length, 25 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 25 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 25 * 2);
    });

    it ('Mesh To Buffer Cube All UVs', function () {
        var model = new OV.Model ();
        var mesh = new OV.Mesh ();

        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
        mesh.AddTextureUV (new OV.Coord2D (0.0, 0.0));
        mesh.AddTextureUV (new OV.Coord2D (1.0, 0.0));
        mesh.AddTextureUV (new OV.Coord2D (1.0, 1.0));

        mesh.AddTriangle (new OV.Triangle (0, 1, 5).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 5, 4).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (1, 2, 6).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (1, 6, 5).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (2, 3, 7).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (2, 7, 6).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (3, 0, 4).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (3, 4, 7).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 3, 2).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (0, 2, 1).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (4, 5, 6).SetTextureUVs (0, 1, 2));
        mesh.AddTriangle (new OV.Triangle (4, 6, 7).SetTextureUVs (0, 1, 2));

        model.AddMesh (mesh);
        OV.FinalizeModel (model);
        assert.ok (OV.CheckModel (model));

        let buffer = OV.ConvertMeshToMeshBuffer (mesh);
        assert.strictEqual (buffer.primitives.length, 1);
        assert.strictEqual (buffer.primitives[0].indices.length, 36);
        assert.strictEqual (buffer.primitives[0].vertices.length, 30 * 3);
        assert.strictEqual (buffer.primitives[0].normals.length, 30 * 3);
        assert.strictEqual (buffer.primitives[0].uvs.length, 30 * 2);
    });
});

}
