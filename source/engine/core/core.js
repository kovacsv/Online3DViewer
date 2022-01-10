export function IsDefined (val)
{
    return val !== undefined && val !== null;
}

export function ValueOrDefault (val, def)
{
    if (val === undefined || val === null) {
        return def;
    }
    return val;
}

export function CopyObjectAttributes (src, dest)
{
    if (!IsDefined (src)) {
        return;
    }
    for (let attribute of Object.keys (src)) {
        if (IsDefined (src[attribute])) {
            dest[attribute] = src[attribute];
        }
    }
}
