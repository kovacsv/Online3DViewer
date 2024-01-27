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

export function IsObjectEmpty (obj)
{
    return Object.keys (obj).length === 0;
}

export function FormatString (template, ...args)
{
    return template.replace (/{([0-9]+)}/g, (match, index) => {
        return args[index] === undefined ? match : args[index];
    });
}

export function EscapeHtmlChars (str)
{
    return str.replace (/</g, '&lt;').replace (/>/g, '&gt;');
}
