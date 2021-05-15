OV.CalculateTriangleNormal = function (v0, v1, v2)
{
    let v = OV.SubCoord3D (v1, v0);
    let w = OV.SubCoord3D (v2, v0);
    
    let normal = new OV.Coord3D (
        v.y * w.z - v.z * w.y,
        v.z * w.x - v.x * w.z,
        v.x * w.y - v.y * w.x
    );

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
        let normalMatrix = new OV.Matrix ().ComposeTRS ([0.0, 0.0, 0.0], trs.rotation, [1.0, 1.0, 1.0]);
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

OV.IsModelEmpty = function (model)
{
    for (let i = 0; i < model.MeshCount (); i++) {
        let mesh = model.GetMesh (i);
        if (mesh.TriangleCount () > 0) {
            return false;
        }
    }
    return true;
};

OV.CloneMesh = function (mesh)
{
    let cloned = new OV.Mesh ();

    cloned.SetName (mesh.GetName ());

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        cloned.AddVertex (vertex.Clone ());
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

OV.CreateMergedModel = function (model)
{
    function MergeMesh (mesh, mergedMesh)
    {
        let vertexOffset = mergedMesh.VertexCount ();
        let normalOffset = mergedMesh.NormalCount ();
        let uvOffset = mergedMesh.TextureUVCount ();

        for (let i = 0; i < mesh.VertexCount (); i++) {
            let vertex = mesh.GetVertex (i);
            mergedMesh.AddVertex (vertex.Clone ());
        }
        for (let i = 0; i < mesh.NormalCount (); i++) {
            let normal = mesh.GetNormal (i);
            mergedMesh.AddNormal (normal.Clone ());
        }
        for (let i = 0; i < mesh.TextureUVCount (); i++) {
            let uv = mesh.GetTextureUV (i);
            mergedMesh.AddTextureUV (uv.Clone ());
        }

        for (let i = 0; i < mesh.TriangleCount (); i++) {
            let triangle = mesh.GetTriangle (i);
            let newTriangle = triangle.Clone ();
            newTriangle.SetVertices (
                triangle.v0 + vertexOffset,
                triangle.v1 + vertexOffset,
                triangle.v2 + vertexOffset
            );
            newTriangle.SetNormals (
                triangle.n0 + normalOffset,
                triangle.n1 + normalOffset,
                triangle.n2 + normalOffset
            );
            if (newTriangle.HasTextureUVs ()) {
                newTriangle.SetTextureUVs (
                    triangle.u0 + uvOffset,
                    triangle.u1 + uvOffset,
                    triangle.u2 + uvOffset
                );
            }
            mergedMesh.AddTriangle (newTriangle);
        }
    }

    let mergedModel = new OV.Model ();
    mergedModel.SetName (model.GetName ());

    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        mergedModel.AddMaterial (material.Clone ());
    }

    let mergedMesh = new OV.Mesh ();
    for (let i = 0; i < model.MeshCount (); i++) {
        let mesh = model.GetMesh (i);
        MergeMesh (mesh, mergedMesh);
    }

    mergedModel.AddMesh (mergedMesh);
    return mergedModel;
};

OV.EnumerateModelVerticesAndTriangles = function (model, callbacks)
{
    for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
        let mesh = model.GetMesh (meshIndex);
        for (let vertexIndex = 0; vertexIndex < mesh.VertexCount (); vertexIndex++) {
            let vertex = mesh.GetVertex (vertexIndex);
            callbacks.onVertex (vertex.x, vertex.y, vertex.z);
        }
    }
    let vertexOffset = 0;
    for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
        let mesh = model.GetMesh (meshIndex);
        for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
            let triangle = mesh.GetTriangle (triangleIndex);
            callbacks.onTriangle (triangle.v0 + vertexOffset, triangle.v1 + vertexOffset, triangle.v2 + vertexOffset);
        }
        vertexOffset += mesh.VertexCount ();
    }
};

OV.EnumerateModelTriangles = function (model, onTriangle)
{
    for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
        let mesh = model.GetMesh (meshIndex);
        for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
            let triangle = mesh.GetTriangle (triangleIndex);
            let v0 = mesh.GetVertex (triangle.v0);
            let v1 = mesh.GetVertex (triangle.v1);
            let v2 = mesh.GetVertex (triangle.v2);
            onTriangle (v0, v1, v2);
        }
    }
};

OV.EnumerateModelTrianglesWithNormals = function (model, onTriangle)
{
    for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
        let mesh = model.GetMesh (meshIndex);
        for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
            let triangle = mesh.GetTriangle (triangleIndex);
            let v0 = mesh.GetVertex (triangle.v0);
            let v1 = mesh.GetVertex (triangle.v1);
            let v2 = mesh.GetVertex (triangle.v2);
            let normal = OV.CalculateTriangleNormal (v0, v1, v2);
            onTriangle (v0, v1, v2, normal);
        }
    }
};

OV.GetMeshBoundingBox = function (mesh)
{
    let box = new OV.Box3D (
        new OV.Coord3D (Infinity, Infinity, Infinity),
        new OV.Coord3D (-Infinity, -Infinity, -Infinity)
    );

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        box.min.x = Math.min (box.min.x, vertex.x);
        box.min.y = Math.min (box.min.y, vertex.y);
        box.min.z = Math.min (box.min.z, vertex.z);
        box.max.x = Math.max (box.max.x, vertex.x);
        box.max.y = Math.max (box.max.y, vertex.y);
        box.max.z = Math.max (box.max.z, vertex.z);
    }
    
    return box;
};
