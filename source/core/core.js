OV =
{

};

OV.ValueOrDefault = function (val, def)
{
    if (val === undefined || val === null) {
        return def;
    }
    return val;
};
