import { ParameterConverter } from '../engine/parameters/parameterlist.js';

export class CookieHandler
{
    constructor ()
    {
        this.expirationDays = 365;
    }

    ClearVal (key)
    {
        this.SetStringVal (key, '');
    }

    SetStringVal (key, value)
    {
		let date = new Date ();
		date.setTime (date.getTime () + (this.expirationDays * 24 * 60 * 60 * 1000));
		document.cookie = key + '=' + value + '; expires=' + date.toUTCString () + ';';
    }

    GetStringVal (key, defVal)
    {
		let cookie = decodeURIComponent (document.cookie);
        let cookieParts = cookie.split (';');
        for (let i = 0; i < cookieParts.length; i++) {
            let currentCookie = cookieParts[i].trim ();
            if (currentCookie.startsWith (key + '=')) {
                return currentCookie.substr (key.length + 1);
            }
        }
        return defVal;
    }

    GetBoolVal (key, defVal)
    {
        let stringVal = this.GetStringVal (key, null);
        if (stringVal === null) {
            return defVal;
        }
        return stringVal === 'true' ? true : false;
    }

    SetBoolVal (key, value)
    {
        this.SetStringVal (key, value ? 'true' : 'false');
    }

    GetIntVal (key, defVal)
    {
        let stringVal = this.GetStringVal (key, null);
        if (stringVal === null) {
            return defVal;
        }
        return parseInt (stringVal, 10);
    }

    SetIntVal (key, value)
    {
        this.SetStringVal (key, value.toString ());
    }

    GetColorVal (key, defVal)
    {
        let stringVal = this.GetStringVal (key, null);
        if (stringVal === null) {
            return defVal;
        }
        return ParameterConverter.StringToColor (stringVal);
    }

    SetColorVal (key, value)
    {
        this.SetStringVal (key, ParameterConverter.ColorToString (value));
    }
}
