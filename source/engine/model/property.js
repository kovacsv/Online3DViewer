export const PropertyType =
{
    Text : 1,
    Integer : 2,
    Number : 3,
    Boolean : 4,
    Percent : 5,
    Color : 6
};

export class Property
{
    constructor (type, name, value)
    {
        this.type = type;
        this.name = name;
        this.value = value;
    }
}

export class PropertyGroup
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
}
