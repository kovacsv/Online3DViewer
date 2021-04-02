OV.ParameterConverter =
{
    CameraToString : function (camera)
    {
        if (camera === null) {
            return null;
        }
        let precision = 5;
        let cameraParameters = [
            camera.eye.x.toPrecision (precision), camera.eye.y.toPrecision (precision), camera.eye.z.toPrecision (precision),
            camera.center.x.toPrecision (precision), camera.center.y.toPrecision (precision), camera.center.z.toPrecision (precision),
            camera.up.x.toPrecision (precision), camera.up.y.toPrecision (precision), camera.up.z.toPrecision (precision)
        ].join (',');
        return cameraParameters;
    },

    StringToCamera : function (urlParam)
    {
        if (urlParam === null || urlParam.length === 0) {
            return null;
        }
        let paramParts = urlParam.split (',');
        if (paramParts.length !== 9) {
            return null;
        }
        let camera = new OV.Camera (
            new OV.Coord3D (parseFloat (paramParts[0]), parseFloat (paramParts[1]), parseFloat (paramParts[2])),
            new OV.Coord3D (parseFloat (paramParts[3]), parseFloat (paramParts[4]), parseFloat (paramParts[5])),
            new OV.Coord3D (parseFloat (paramParts[6]), parseFloat (paramParts[7]), parseFloat (paramParts[8]))
        );
        return camera;
    },

    ModelUrlsToString : function (urls)
    {
        if (urls === null) {
            return null;
        }
        return urls.join (',');
    },

    StringToModelUrls : function (urlParam)
    {
        if (urlParam === null || urlParam.length === 0) {
            return null;
        }
        return urlParam.split (',');
    }
};

OV.ParameterListBuilder = class
{
    constructor ()
    {
        this.urlParams = '';
    }

    AddModelUrls (urls)
    {
        this.AddUrlPart ('model', OV.ParameterConverter.ModelUrlsToString (urls));
        return this;
    }

    AddCamera (camera)
    {
        this.AddUrlPart ('camera', OV.ParameterConverter.CameraToString (camera));
        return this;
    }

    AddUrlPart (keyword, urlPart)
    {
        if (keyword === null || urlPart === null) {
            return;
        }
        if (this.urlParams.length > 0) {
            this.urlParams += '$';
        }
        this.urlParams += keyword + '=' + urlPart;
    }

    GetUrlParams ()
    {
        return this.urlParams;
    } 
};

OV.ParameterListParser = class
{
    constructor (urlParams)
    {
        this.urlParams = urlParams;
    }

    GetModelUrls ()
    {
        // detect legacy links
        if (this.urlParams.indexOf ('=') === -1) {
            return this.urlParams.split (',');
        }

        let keywordParams = this.GetKeywordParams ('model');
        return OV.ParameterConverter.StringToModelUrls (keywordParams);
    }

    GetCamera ()
    {
        let keywordParams = this.GetKeywordParams ('camera');
        return OV.ParameterConverter.StringToCamera (keywordParams);
    }
    
    GetKeywordParams (keyword)
    {
        if (this.urlParams === null || this.urlParams.length === 0) {
            return null;
        }
        let keywordToken = keyword + '=';
        let urlParts = this.urlParams.split ('$');
        for (let i = 0; i < urlParts.length; i++) {
            let urlPart = urlParts[i];
            if (urlPart.startsWith (keywordToken)) {
                return urlPart.substr (keywordToken.length);
            }
        }
        return null;
    }
};

OV.CreateUrlParameters = function (urls, camera)
{
    let builder = new OV.ParameterListBuilder ();
    builder.AddModelUrls (urls);
    builder.AddCamera (camera);
    return builder.GetUrlParams ();
};
