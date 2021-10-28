OV =
{

};

OV.IsDefined = function (val)
{
    return val !== undefined && val !== null;
};

OV.ValueOrDefault = function (val, def)
{
    if (val === undefined || val === null) {
        return def;
    }
    return val;
};
