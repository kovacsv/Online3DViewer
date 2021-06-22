OV.Element = class
{
    constructor ()
    {
        this.name = '';
        this.properties = [];
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

    PropertyCount ()
    {
        return this.properties.length;
    }

    AddProperty (property)
    {
        this.properties.push (property);
        return this.properties.length - 1;
    }

    GetProperty (index)
    {
        return this.properties[index];
    }

    EnumerateVertices (onVertex)
    {

    }

    EnumerateTriangles (onTriangle)
    {

    }    
};
