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

OV.GetMeshBoundingBox = function (mesh)
{
    let min = new OV.Coord3D (Infinity, Infinity, Infinity);
    let max = new OV.Coord3D (-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        min.x = Math.min (min.x, vertex.x);
        min.y = Math.min (min.y, vertex.y);
        min.z = Math.min (min.z, vertex.z);
        max.x = Math.max (max.x, vertex.x);
        max.y = Math.max (max.y, vertex.y);
        max.z = Math.max (max.z, vertex.z);
    }
    
    return [min, max];
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
