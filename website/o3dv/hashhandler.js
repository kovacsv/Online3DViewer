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
        let parameters = this.GetFromHash ('camera');
        if (parameters === null) {
            return null;
        }
        let splitted = parameters.split (',');
        if (splitted.length !== 9) {
            return null;
        }
        let camera = new OV.Camera (
            new OV.Coord3D (parseFloat (splitted[0]), parseFloat (splitted[1]), parseFloat (splitted[2])),
            new OV.Coord3D (parseFloat (splitted[3]), parseFloat (splitted[4]), parseFloat (splitted[5])),
            new OV.Coord3D (parseFloat (splitted[6]), parseFloat (splitted[7]), parseFloat (splitted[8]))
        );
        return camera;
    }

    GetModelFilesFromHash ()
    {
        let hash = this.GetHash ();
        if (hash.length === 0) {
            return null;
        }

        // detect legacy links
        let modelKeyword = 'model';
        let keywordToken = modelKeyword + '=';
        if (hash.indexOf (keywordToken) === -1) {
            return hash.split (',');
        }

        let fileList = this.GetFromHash (modelKeyword);
        if (fileList === null) {
            return null;
        }
        return fileList.split (',');
    }

    SetModelFilesToHash (files)
    {
        this.SetHash ('model=' + files.join (','));
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
