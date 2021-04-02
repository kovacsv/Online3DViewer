OV.HashHandler = class
{
    constructor ()
    {
        this.skipNextEvent = false;
        this.eventListener = null;
    }

    SetEventListener (eventListener)
    {
        this.eventListener = eventListener;
        window.onhashchange = this.OnChange.bind (this);
    }

    SkipNextEventHandler ()
    {
        this.skipNextEvent = true;
    }

    HasHash ()
    {
        let hash = this.GetHash ();
        return hash.length > 0;
    }

    ClearHash ()
    {
        this.SetHash ('');
    }

    GetCameraFromHash ()
    {
        let parser = OV.CreateUrlParser (this.GetHash ());
        return parser.GetCamera ();
    }

    GetModelFilesFromHash ()
    {
        let parser = OV.CreateUrlParser (this.GetHash ());
        return parser.GetModelUrls ();
    }

    SetModelFilesToHash (files)
    {
        let params = OV.CreateUrlParameters (files, null);
        this.SetHash (params);
    }

    GetFromHash (keyword)
    {
        let hash = this.GetHash ();
        if (hash.length === 0) {
            return null;
        }
        let keywordToken = keyword + '=';
        let hashParts = hash.split ('$');
        for (let i = 0; i < hashParts.length; i++) {
            let hashPart = hashParts[i];
            if (hashPart.startsWith (keywordToken)) {
                return hashPart.substr (keywordToken.length);
            }
        }
        return null;
    }

    GetHash ()
    {
        return window.location.hash.substr (1);
    }

    SetHash (hash)
    {
        window.location.hash = hash;
    }

    OnChange ()
    {
        if (this.skipNextEvent) {
            this.skipNextEvent = false;
            return;
        }
        this.eventListener ();
    }
};
