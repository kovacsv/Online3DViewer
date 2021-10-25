OV.MeshInstance = class extends OV.Object3D
{
    constructor (mesh, transformation)
    {
        super ();
        this.mesh = mesh;
        this.transformation = transformation;
    }

    VertexCount ()
    {
        return this.mesh.VertexCount ();
    }

    NormalCount ()
    {
        return this.mesh.NormalCount ();
    }

    TextureUVCount ()
    {
        return this.mesh.TextureUVCount ();
    }

    TriangleCount ()
    {
        return this.mesh.TriangleCount ();
    }

    EnumerateVertices (onVertex)
    {
        if (this.transformation.IsIdentity ()) {
            this.mesh.EnumerateVertices (onVertex);
        } else {
            this.mesh.EnumerateVertices ((vertex) => {
                const transformed = this.transformation.TransformCoord3D (vertex);
                onVertex (transformed);
            });
        }
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        this.mesh.EnumerateTriangleVertexIndices (onTriangleVertexIndices);
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        if (this.transformation.IsIdentity ()) {
            this.mesh.EnumerateTriangleVertices (onTriangleVertices);
        } else {
            this.mesh.EnumerateTriangleVertices ((v0, v1, v2) => {
                const v0Transformed = this.transformation.TransformCoord3D (v0);
                const v1Transformed = this.transformation.TransformCoord3D (v1);
                const v2Transformed = this.transformation.TransformCoord3D (v2);
                onTriangleVertices (v0Transformed, v1Transformed, v2Transformed);
            });
        }
    }
};
