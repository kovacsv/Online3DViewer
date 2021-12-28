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

OV.CopyObjectAttributes = function (src, dest)
{
    if (!OV.IsDefined (src)) {
        return;
    }
    for (let attribute of Object.keys (src)) {
        if (OV.IsDefined (src[attribute])) {
            dest[attribute] = src[attribute];
        }
    }
};
