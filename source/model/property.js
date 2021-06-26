OV.PropertyType =
{
    Text : 1,
    Integer : 2,
    Number : 3,
    Percent : 4,
    Color : 5
};

OV.Property = class
{
    constructor (type, name, value)
    {
        this.type = type;
        this.name = name;
        this.value = value;
    }
};

OV.PropertyGroup = class
{
    constructor (name)
    {
        this.name = name;
        this.properties = [];
    }

    PropertyCount ()
    {
        return this.properties.length;
    }

    AddProperty (property)
    {
        this.properties.push (property);
    }

    GetProperty (index)
    {
        return this.properties[index];
    }
};
