OV.Mesh = class extends OV.ModelObject3D
{
    constructor ()
    {
        super ();
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];
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

    EnumerateVertices (onVertex)
    {
        for (const vertex of this.vertices) {
            onVertex (vertex);
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
        for (const triangle of this.triangles) {
            let v0 = this.vertices[triangle.v0];
            let v1 = this.vertices[triangle.v1];
            let v2 = this.vertices[triangle.v2];
            onTriangleVertices (v0, v1, v2);
        }
    }
};
