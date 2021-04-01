OV.Mesh = class
{
    constructor ()
    {
        this.name = '';
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];
    }

    GetName ()
    {
        return this.name;
    }
    
    SetName (name)
    {
        this.name = name;
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
};
