OV.Mesh = class extends OV.ModelObject3D
{
    constructor ()
    {
        super ();
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];
        this.transformation = new OV.Transformation ();
    }

    VertexCount ()
    {
        return this.vertices.length;
    }

    NormalCount ()
    {
        return this.normals.length;
    }

    TextureUVCount ()
    {
        return this.uvs.length;
    }

    TriangleCount ()
    {
        return this.triangles.length;
    }

    AddVertex (vertex)
    {
        this.vertices.push (vertex);
        return this.vertices.length - 1;
    }

    SetVertex (index, vertex)
    {
        this.vertices[index] = vertex;
    }

    GetVertex (index)
    {
        return this.vertices[index];
    }

    AddNormal (normal)
    {
        this.normals.push (normal);
        return this.normals.length - 1;
    }

    SetNormal (index, normal)
    {
        this.normals[index] = normal;
    }

    GetNormal (index)
    {
        return this.normals[index];
    }

    AddTextureUV (uv)
    {
        this.uvs.push (uv);
        return this.uvs.length - 1;
    }

    SetTextureUV (index, uv)
    {
        this.uvs[index] = uv;
    }

    GetTextureUV (index)
    {
        return this.uvs[index];
    }

    AddTriangle (triangle)
    {
        this.triangles.push (triangle);
        return this.triangles.length - 1;
    }

    GetTriangle (index)
    {
        return this.triangles[index];
    }

    SetTransformation (transformation)
    {
        this.transformation = transformation;
    }

    GetTransformation ()
    {
        return this.transformation;
    }

    EnumerateVertices (onVertex)
    {
        if (this.transformation.IsIdentity ()) {
            for (const vertex of this.vertices) {
                onVertex (vertex);
            }
        } else {
            for (const vertex of this.vertices) {
                const transformed = this.transformation.TransformCoord3D (vertex);
                onVertex (transformed);
            }
        }
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        for (const triangle of this.triangles) {
            onTriangleVertexIndices (triangle.v0, triangle.v1, triangle.v2);
        }
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        if (this.transformation.IsIdentity ()) {
            for (const triangle of this.triangles) {
                let v0 = this.vertices[triangle.v0];
                let v1 = this.vertices[triangle.v1];
                let v2 = this.vertices[triangle.v2];
                onTriangleVertices (v0, v1, v2);
            }
        } else {
            for (const triangle of this.triangles) {
                const v0Transformed = this.transformation.TransformCoord3D (this.vertices[triangle.v0]);
                const v1Transformed = this.transformation.TransformCoord3D (this.vertices[triangle.v1]);
                const v2Transformed = this.transformation.TransformCoord3D (this.vertices[triangle.v2]);
                onTriangleVertices (v0Transformed, v1Transformed, v2Transformed);
            }
        }
    }
};
