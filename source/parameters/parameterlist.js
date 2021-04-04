OV.ParameterConverter =
{
    NumberToString (number)
    {
        let precision = 5;
        return number.toPrecision (precision);
    },

    StringToNumber (str)
    {
        return parseFloat (str);
    },

    CameraToString : function (camera)
    {
        if (camera === null) {
            return null;
        }
        let cameraParameters = [
            this.NumberToString (camera.eye.x), this.NumberToString (camera.eye.y), this.NumberToString (camera.eye.z),
            this.NumberToString (camera.center.x), this.NumberToString (camera.center.y), this.NumberToString (camera.center.z),
            this.NumberToString (camera.up.x), this.NumberToString (camera.up.y), this.NumberToString (camera.up.z)
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
            new OV.Coord3D (this.StringToNumber (paramParts[0]), this.StringToNumber (paramParts[1]), this.StringToNumber (paramParts[2])),
            new OV.Coord3D (this.StringToNumber (paramParts[3]), this.StringToNumber (paramParts[4]), this.StringToNumber (paramParts[5])),
            new OV.Coord3D (this.StringToNumber (paramParts[6]), this.StringToNumber (paramParts[7]), this.StringToNumber (paramParts[8]))
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
    constructor (separator)
    {
        this.separator = separator;
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
            this.urlParams += this.separator;
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
    constructor (urlParams, separator)
    {
        this.separator = separator;
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
        let urlParts = this.urlParams.split (this.separator);
        for (let i = 0; i < urlParts.length; i++) {
            let urlPart = urlParts[i];
            if (urlPart.startsWith (keywordToken)) {
                return urlPart.substr (keywordToken.length);
            }
        }
        return null;
    }
};

OV.CreateUrlBuilder = function ()
{
    return new OV.ParameterListBuilder ('$');
};

OV.CreateUrlParser = function (urlParams)
{
    return new OV.ParameterListParser (urlParams, '$');
};

OV.CreateUrlParameters = function (urls, camera)
{
    let builder = OV.CreateUrlBuilder ();
    builder.AddModelUrls (urls);
    builder.AddCamera (camera);
    return builder.GetUrlParams ();
};
