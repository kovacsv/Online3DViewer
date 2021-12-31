OV.MeshType =
{
    Empty : 0,
    TriangleMesh : 1
};

OV.GetMeshType = function (mesh)
{
    if (mesh.TriangleCount () > 0) {
        return OV.MeshType.TriangleMesh;
    }
    return OV.MeshType.Empty;
};

OV.CalculateTriangleNormal = function (v0, v1, v2)
{
    let v = OV.SubCoord3D (v1, v0);
    let w = OV.SubCoord3D (v2, v0);
    let normal = OV.CrossVector3D (v, w);
    normal.Normalize ();
    return normal;
};

OV.TransformMesh = function (mesh, transformation)
{
    if (transformation.IsIdentity ()) {
        return;
    }

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        let transformed = transformation.TransformCoord3D (vertex);
        vertex.x = transformed.x;
        vertex.y = transformed.y;
        vertex.z = transformed.z;
    }

    if (mesh.NormalCount () > 0) {
        let trs = transformation.GetMatrix ().DecomposeTRS ();
        let normalMatrix = new OV.Matrix ().ComposeTRS (new OV.Coord3D (0.0, 0.0, 0.0), trs.rotation, new OV.Coord3D (1.0, 1.0, 1.0));
        let normalTransformation = new OV.Transformation (normalMatrix);
        for (let i = 0; i < mesh.NormalCount (); i++) {
            let normal = mesh.GetNormal (i);
            let transformed = normalTransformation.TransformCoord3D (normal);
            normal.x = transformed.x;
            normal.y = transformed.y;
            normal.z = transformed.z;
        }
    }
};

OV.FlipMeshTrianglesOrientation = function (mesh)
{
    for (let i = 0; i < mesh.TriangleCount (); i++) {
        let triangle = mesh.GetTriangle (i);
        let tmp = triangle.v1;
        triangle.v1 = triangle.v2;
        triangle.v2 = tmp;
    }
};

OV.CloneMesh = function (mesh)
{
    let cloned = new OV.Mesh ();

    cloned.SetName (mesh.GetName ());

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        cloned.AddVertex (vertex.Clone ());
    }

    for (let i = 0; i < mesh.VertexColorCount (); i++) {
        let color = mesh.GetVertexColor (i);
        cloned.AddVertexColor (color.Clone ());
    }

    for (let i = 0; i < mesh.NormalCount (); i++) {
        let normal = mesh.GetNormal (i);
        cloned.AddNormal (normal.Clone ());
    }

    for (let i = 0; i < mesh.TextureUVCount (); i++) {
        let uv = mesh.GetTextureUV (i);
        cloned.AddTextureUV (uv.Clone ());
    }

    for (let i = 0; i < mesh.TriangleCount (); i++) {
        let triangle = mesh.GetTriangle (i);
        cloned.AddTriangle (triangle.Clone ());
    }

    return cloned;
};
