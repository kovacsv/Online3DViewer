import { ParameterConverter } from '../engine/parameters/parameterlist.js';

export function CookieSetStringVal (key, value)
{
    let date = new Date ();
    let expirationDays = 365;
    date.setTime (date.getTime () + (expirationDays * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + '; expires=' + date.toUTCString () + ';';
}

export function CookieGetStringVal (key, defVal)
{
    let cookie = decodeURIComponent (document.cookie);
    let cookieParts = cookie.split (';');
    for (let i = 0; i < cookieParts.length; i++) {
        let currentCookie = cookieParts[i].trim ();
        if (currentCookie.startsWith (key + '=')) {
            return currentCookie.substring (key.length + 1);
        }
    }
    return defVal;
}

export function CookieGetBoolVal (key, defVal)
{
    let stringVal = CookieGetStringVal (key, null);
    if (stringVal === null) {
        return defVal;
    }
    return stringVal === 'true' ? true : false;
}

export function CookieSetBoolVal (key, value)
{
    CookieSetStringVal (key, value ? 'true' : 'false');
}

export function CookieGetIntVal (key, defVal)
{
    let stringVal = CookieGetStringVal (key, null);
    if (stringVal === null) {
        return defVal;
    }
    return parseInt (stringVal, 10);
}

export function CookieSetIntVal (key, value)
{
    CookieSetStringVal (key, value.toString ());
}

export function CookieGetColorVal (key, defVal)
{
    let stringVal = CookieGetStringVal (key, null);
    if (stringVal === null) {
        return defVal;
    }
    return ParameterConverter.StringToColor (stringVal);
}

export function CookieSetColorVal (key, value)
{
    CookieSetStringVal (key, ParameterConverter.ColorToString (value));
}

export function CookieClearVal (key)
{
    CookieSetStringVal (key, '');
}
