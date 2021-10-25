OV.Object3D = class
{
    constructor ()
    {

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

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {

    }

    EnumerateTriangleVertices (onTriangleVertices)
    {

    }
};

OV.ModelObject3D = class extends OV.Object3D
{
    constructor ()
    {
        super ();
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
};
