OV.ExporterModel = class
{
    constructor (model)
    {
        this.model = model;
    }

    MaterialCount ()
    {
        return this.model.MaterialCount ();
    }

    VertexCount ()
    {
        return this.model.VertexCount ();
    }

    TriangleCount ()
    {
        return this.model.TriangleCount ();
    }

    GetMaterial (index)
    {
        return this.model.GetMaterial (index);
    }

    EnumerateMeshInstances (onMeshInstance)
    {
        this.model.EnumerateMeshInstances (onMeshInstance);
    }

    EnumerateTransformedMeshes (onMesh)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            const transformed = meshInstance.GetTransformedMesh ();
            onMesh (transformed);
        });
    }

    EnumerateVerticesAndTriangles (callbacks)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateVertices ((vertex) => {
                callbacks.onVertex (vertex.x, vertex.y, vertex.z);
            });
        });
        let vertexOffset = 0;
        this.model.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateTriangleVertexIndices ((v0, v1, v2) => {
                callbacks.onTriangle (v0 + vertexOffset, v1 + vertexOffset, v2 + vertexOffset);
            });
            vertexOffset += meshInstance.VertexCount ();
        });
    }

    EnumerateTrianglesWithNormals (onTriangle)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateTriangleVertices ((v0, v1, v2) => {
                let normal = OV.CalculateTriangleNormal (v0, v1, v2);
                onTriangle (v0, v1, v2, normal);
            });
        });
    }
};
