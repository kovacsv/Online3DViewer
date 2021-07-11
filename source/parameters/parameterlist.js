OV.ParameterConverter =
{
    IntegerToString (integer)
    {
        return integer.toString ();
    },

    StringToInteger (str)
    {
        return parseInt (str, 10);
    },

    NumberToString (number)
    {
        let precision = 5;
        return number.toPrecision (precision);
    },

    StringToNumber (str)
    {
        return parseFloat (str);
    },

    ModelUrlsToString : function (urls)
    {
        if (urls === null) {
            return null;
        }
        return urls.join (',');
    },

    StringToModelUrls : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        return str.split (',');
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

    StringToCamera : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
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

    ColorToString : function (color)
    {
        if (color === null) {
            return null;
        }
        let colorParameters = [
            this.IntegerToString (color.r),
            this.IntegerToString (color.g),
            this.IntegerToString (color.b)
        ].join (',');
        return colorParameters;
    },

    StringToColor : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 3) {
            return null;
        }
        let color = new OV.Color (
            this.StringToInteger (paramParts[0]),
            this.StringToInteger (paramParts[1]),
            this.StringToInteger (paramParts[2])
        );
        return color;
    }
};

OV.ParameterListBuilder = class
{
    constructor (separator)
    {
        this.separator = separator;
        this.paramList = '';
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

    AddBackground (background)
    {
        this.AddUrlPart ('backgroundcolor', OV.ParameterConverter.ColorToString (background));
        return this;
    }

    AddColor (color)
    {
        this.AddUrlPart ('defaultcolor', OV.ParameterConverter.ColorToString (color));
        return this;
    }

    AddUrlPart (keyword, urlPart)
    {
        if (keyword === null || urlPart === null) {
            return;
        }
        if (this.paramList.length > 0) {
            this.paramList += this.separator;
        }
        this.paramList += keyword + '=' + urlPart;
    }

    GetParameterList ()
    {
        return this.paramList;
    } 
};

OV.ParameterListParser = class
{
    constructor (paramList, separator)
    {
        this.separator = separator;
        this.paramList = paramList;
    }

    GetModelUrls ()
    {
        // detect legacy links
        if (this.paramList.indexOf ('=') === -1) {
            return this.paramList.split (',');
        }

        let keywordParams = this.GetKeywordParams ('model');
        return OV.ParameterConverter.StringToModelUrls (keywordParams);
    }

    GetCamera ()
    {
        let keywordParams = this.GetKeywordParams ('camera');
        return OV.ParameterConverter.StringToCamera (keywordParams);
    }

    GetBackgroundColor ()
    {
        let backgroundParams = this.GetKeywordParams ('backgroundcolor');
        return OV.ParameterConverter.StringToColor (backgroundParams);
    }

    GetDefaultColor ()
    {
        let colorParams = this.GetKeywordParams ('defaultcolor');
        return OV.ParameterConverter.StringToColor (colorParams);
    }
    
    GetKeywordParams (keyword)
    {
        if (this.paramList === null || this.paramList.length === 0) {
            return null;
        }
        let keywordToken = keyword + '=';
        let urlParts = this.paramList.split (this.separator);
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

OV.CreateModelUrlParameters = function (urls)
{
    let builder = OV.CreateUrlBuilder ();
    builder.AddModelUrls (urls);
    return builder.GetParameterList ();
};
