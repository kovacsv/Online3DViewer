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
