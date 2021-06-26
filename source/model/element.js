OV.Element = class
{
    constructor ()
    {
        this.name = '';
        this.propertyGroups = [];
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

    PropertyGroupCount ()
    {
        return this.propertyGroups.length;
    }

    AddPropertyGroup (propertyGroup)
    {
        this.propertyGroups.push (propertyGroup);
        return this.propertyGroups.length - 1;
    }

    GetPropertyGroup (index)
    {
        return this.propertyGroups[index];
    }

    EnumerateVertices (onVertex)
    {

    }

    EnumerateTriangles (onTriangle)
    {

    }    
};
