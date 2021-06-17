OV.CookieHandler = class
{
    constructor ()
    {
        this.expirationDays = 30;
    }

    ClearVal (key)
    {
        this.SetStringVal (key, '');
    }

    GetBoolVal (key, defVal)
    {
        let stringVal = this.GetStringVal (key);
        if (stringVal === null) {
            return defVal;
        }
        return stringVal === 'true' ? true : false;
    }

    SetBoolVal (key, value)
    {
        this.SetStringVal (key, value ? 'true' : false);
    }

    SetStringVal (key, value)
    {
		let date = new Date ();
		date.setTime (date.getTime () + (this.expirationDays * 24 * 60 * 60 * 1000));
		document.cookie = key + '=' + value + '; expires=' + date.toUTCString () + ';';
    }

    GetStringVal (key)
    {
		let cookie = decodeURIComponent (document.cookie);
        let cookieParts = cookie.split (';');
        for (let i = 0; i < cookieParts.length; i++) {
            let currentCookie = cookieParts[i].trim ();
            if (currentCookie.startsWith (key + '=')) {
                return currentCookie.substr (key.length + 1);
            }
        }
        return null;
    }
};
