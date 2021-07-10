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

OV.EnumerateKeyValuePairs = function (arr, proc)
{
    for (let key in arr) {
        if (arr.hasOwnProperty (key)) {
            proc (key, arr[key]);
        }
    }
};
