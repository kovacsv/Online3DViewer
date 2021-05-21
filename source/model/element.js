OV.Element = class
{
    constructor ()
    {
        this.name = '';
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
        return 0;
    }
    
    NormalCount ()
    {
        return 0;
    }
    
    TextureUVCount ()
    {
        return 0;
    }
    
    TriangleCount ()
    {
        return 0;
    }

    EnumerateVertices (onVertex)
    {

    }

    EnumerateTriangles (onTriangle)
    {

    }    
};
