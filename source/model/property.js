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
