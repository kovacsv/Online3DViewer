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

OV.EnumerateTrianglesWithNormals = function (element, onTriangle)
{
    element.EnumerateTriangles ((v0, v1, v2) => {
        let normal = OV.CalculateTriangleNormal (v0, v1, v2);
        onTriangle (v0, v1, v2, normal);
    });
};

OV.GetBoundingBox = function (element)
{
    let calculator = new OV.BoundingBoxCalculator3D ();
    element.EnumerateVertices ((vertex) => {
        calculator.AddPoint (vertex);
    });
    return calculator.GetBox ();
};

OV.GetTopology = function (element)
{
    function GetVertexIndex (vertex, octree, topology)
    {
        let index = octree.FindPoint (vertex);
        if (index === null) {
            index = topology.AddVertex ();
            octree.AddPoint (vertex, index);
        }
        return index;
    }

    let boundingBox = OV.GetBoundingBox (element);
    let octree = new OV.Octree (boundingBox);
    let topology = new OV.Topology ();
    
    element.EnumerateTriangles ((v0, v1, v2) => {
        let v0Index = GetVertexIndex (v0, octree, topology);
        let v1Index = GetVertexIndex (v1, octree, topology);
        let v2Index = GetVertexIndex (v2, octree, topology);
        topology.AddTriangle (v0Index, v1Index, v2Index);
    });
    return topology;
};

OV.IsSolid = function (element)
{
    function GetEdgeOrientationInTriangle (topology, triangleIndex, edgeIndex)
    {
        const triangle = topology.triangles[triangleIndex];
        const triEdge1 = topology.triangleEdges[triangle.triEdge1];
        const triEdge2 = topology.triangleEdges[triangle.triEdge2];
        const triEdge3 = topology.triangleEdges[triangle.triEdge3];
        if (triEdge1.edge === edgeIndex) {
            return triEdge1.reversed;
        }
        if (triEdge2.edge === edgeIndex) {
            return triEdge2.reversed;
        }
        if (triEdge3.edge === edgeIndex) {
            return triEdge3.reversed;
        }
        return null;
    }

    const topology = OV.GetTopology (element);
    for (let edgeIndex = 0; edgeIndex < topology.edges.length; edgeIndex++) {
        const edge = topology.edges[edgeIndex];
        let triCount = edge.triangles.length;
        if (triCount === 0 || triCount % 2 !== 0) {
            return false;
        }
        let edgesDirection = 0;
        for (let triIndex = 0; triIndex < edge.triangles.length; triIndex++) {
            const triangleIndex = edge.triangles[triIndex];
            const edgeOrientation = GetEdgeOrientationInTriangle (topology, triangleIndex, edgeIndex);
            if (edgeOrientation) {
                edgesDirection += 1;
            } else {
                edgesDirection -= 1;
            }
        }
        if (edgesDirection !== 0) {
            return false;
        }
    }
    return true;
};

OV.HasDefaultMaterial = function (model)
{
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.isDefault) {
            return true;
        }
    }
    return false;
};

OV.ReplaceDefaultMaterialColor = function (model, color)
{
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.isDefault) {
            material.color = color;
        }
    }
};
