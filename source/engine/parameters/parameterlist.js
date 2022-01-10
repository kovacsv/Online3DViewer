import { Coord3D } from '../geometry/coord3d.js';
import { Color } from '../model/color.js';
import { Camera } from '../viewer/navigation.js';

export let ParameterConverter =
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
        let camera = new Camera (
            new Coord3D (this.StringToNumber (paramParts[0]), this.StringToNumber (paramParts[1]), this.StringToNumber (paramParts[2])),
            new Coord3D (this.StringToNumber (paramParts[3]), this.StringToNumber (paramParts[4]), this.StringToNumber (paramParts[5])),
            new Coord3D (this.StringToNumber (paramParts[6]), this.StringToNumber (paramParts[7]), this.StringToNumber (paramParts[8]))
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
        let color = new Color (
            this.StringToInteger (paramParts[0]),
            this.StringToInteger (paramParts[1]),
            this.StringToInteger (paramParts[2])
        );
        return color;
    },

    EdgeSettingsToString : function (edgeSettings)
    {
        if (edgeSettings === null) {
            return null;
        }
        let edgeSettingsParameters = [
            edgeSettings.showEdges ? 'on' : 'off',
            this.ColorToString (edgeSettings.edgeColor),
            this.IntegerToString (edgeSettings.edgeThreshold),
        ].join (',');
        return edgeSettingsParameters;
    },

    StringToEdgeSettings : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 5) {
            return null;
        }
        let edgeSettings = {
            showEdges : paramParts[0] === 'on' ? true : false,
            edgeColor : new Color (
                this.StringToInteger (paramParts[1]),
                this.StringToInteger (paramParts[2]),
                this.StringToInteger (paramParts[3])
            ),
            edgeThreshold : this.StringToInteger (paramParts[4])
        };
        return edgeSettings;
    }
};

export class ParameterListBuilder
{
    constructor (separator)
    {
        this.separator = separator;
        this.paramList = '';
    }

    AddModelUrls (urls)
    {
        this.AddUrlPart ('model', ParameterConverter.ModelUrlsToString (urls));
        return this;
    }

    AddCamera (camera)
    {
        this.AddUrlPart ('camera', ParameterConverter.CameraToString (camera));
        return this;
    }

    AddBackgroundColor (background)
    {
        this.AddUrlPart ('backgroundcolor', ParameterConverter.ColorToString (background));
        return this;
    }

    AddDefaultColor (color)
    {
        this.AddUrlPart ('defaultcolor', ParameterConverter.ColorToString (color));
        return this;
    }

    AddEdgeSettings (edgeSettings)
    {
        this.AddUrlPart ('edgesettings', ParameterConverter.EdgeSettingsToString (edgeSettings));
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
}

export class ParameterListParser
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
        return ParameterConverter.StringToModelUrls (keywordParams);
    }

    GetCamera ()
    {
        let keywordParams = this.GetKeywordParams ('camera');
        return ParameterConverter.StringToCamera (keywordParams);
    }

    GetBackgroundColor ()
    {
        let backgroundParams = this.GetKeywordParams ('backgroundcolor');
        return ParameterConverter.StringToColor (backgroundParams);
    }

    GetDefaultColor ()
    {
        let colorParams = this.GetKeywordParams ('defaultcolor');
        return ParameterConverter.StringToColor (colorParams);
    }

    GetEdgeSettings ()
    {
        let edgeSettingsParams = this.GetKeywordParams ('edgesettings');
        return ParameterConverter.StringToEdgeSettings (edgeSettingsParams);
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
}

export function CreateUrlBuilder ()
{
    return new ParameterListBuilder ('$');
}

export function CreateUrlParser (urlParams)
{
    return new ParameterListParser (urlParams, '$');
}

export function CreateModelUrlParameters (urls)
{
    let builder = CreateUrlBuilder ();
    builder.AddModelUrls (urls);
    return builder.GetParameterList ();
}
