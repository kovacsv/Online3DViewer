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
        this.mesh.EnumerateVertices ((vertex) => {
            const transformed = this.transformation.TransformCoord3D (vertex);
            onVertex (transformed);
        });
    }

    EnumerateTriangles (onTriangle)
    {
        this.mesh.EnumerateTriangles (onTriangle);
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        this.mesh.EnumerateTriangleVertices ((v0, v1, v2) => {
            const v0Transformed = this.transformation.TransformCoord3D (v0);
            const v1Transformed = this.transformation.TransformCoord3D (v1);
            const v2Transformed = this.transformation.TransformCoord3D (v2);
            onTriangleVertices (v0Transformed, v1Transformed, v2Transformed);
        });
    }
};
