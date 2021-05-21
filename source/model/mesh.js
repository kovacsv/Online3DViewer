OV.Mesh = class extends OV.Element
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
        for (let vertexIndex = 0; vertexIndex < this.vertices.length; vertexIndex++) {
            let vertex = this.vertices[vertexIndex];
            onVertex (vertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (let triangleIndex = 0; triangleIndex < this.triangles.length; triangleIndex++) {
            let triangle = this.triangles[triangleIndex];
            let v0 = this.vertices[triangle.v0];
            let v1 = this.vertices[triangle.v1];
            let v2 = this.vertices[triangle.v2];
            onTriangle (v0, v1, v2);
        }
    }      
};
