import { FormatString } from './core.js';

let gLocalizedStrings = null;
let gLanguageCode = null;

export function SetLocalizedStrings (localizedStrings)
{
    gLocalizedStrings = localizedStrings;
}

export function SetLanguageCode (languageCode)
{
    gLanguageCode = languageCode;
}

export function Loc (str)
{
    if (gLocalizedStrings === null || gLanguageCode === null) {
        return str;
    }
    if (!gLocalizedStrings[str] || !gLocalizedStrings[str][gLanguageCode]) {
        return str;
    }
    return gLocalizedStrings[str][gLanguageCode];
}

export function FLoc (str, ...args)
{
    return FormatString (Loc (str), ...args);
}
