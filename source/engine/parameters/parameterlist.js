import { Coord3D } from '../geometry/coord3d.js';
import { RGBAColor, RGBColor } from '../model/color.js';
import { Camera, CameraMode } from '../viewer/camera.js';
import { EdgeSettings } from '../viewer/viewermodel.js';

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
        return number.toFixed (precision);
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
            this.NumberToString (camera.up.x), this.NumberToString (camera.up.y), this.NumberToString (camera.up.z),
            this.NumberToString (camera.fov)
        ].join (',');
        return cameraParameters;
    },

    CameraModeToString : function (cameraMode)
    {
        if (cameraMode === CameraMode.Perspective) {
            return 'perspective';
        } else if (cameraMode === CameraMode.Orthographic) {
            return 'orthographic';
        }
        return null;
    },

    StringToCamera : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 9 && paramParts.length !== 10) {
            return null;
        }

        let fieldOfView = 45.0;
        if (paramParts.length >= 10) {
            fieldOfView = this.StringToNumber (paramParts[9]);
        }

        let camera = new Camera (
            new Coord3D (this.StringToNumber (paramParts[0]), this.StringToNumber (paramParts[1]), this.StringToNumber (paramParts[2])),
            new Coord3D (this.StringToNumber (paramParts[3]), this.StringToNumber (paramParts[4]), this.StringToNumber (paramParts[5])),
            new Coord3D (this.StringToNumber (paramParts[6]), this.StringToNumber (paramParts[7]), this.StringToNumber (paramParts[8])),
            fieldOfView
        );
        return camera;
    },

    StringToCameraMode : function (str)
    {
        if (str === 'perspective') {
            return CameraMode.Perspective;
        } else if (str === 'orthographic') {
            return CameraMode.Orthographic;
        }
        return null;
    },

    RGBColorToString : function (color)
    {
        if (color === null) {
            return null;
        }
        return [
            this.IntegerToString (color.r),
            this.IntegerToString (color.g),
            this.IntegerToString (color.b)
        ].join (',');
    },

    RGBAColorToString : function (color)
    {
        if (color === null) {
            return null;
        }
        return [
            this.IntegerToString (color.r),
            this.IntegerToString (color.g),
            this.IntegerToString (color.b),
            this.IntegerToString (color.a)
        ].join (',');
    },

    StringToRGBColor : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 3) {
            return null;
        }
        return new RGBColor (
            this.StringToInteger (paramParts[0]),
            this.StringToInteger (paramParts[1]),
            this.StringToInteger (paramParts[2])
        );
    },

    StringToRGBAColor : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 3 && paramParts.length !== 4) {
            return null;
        }
        let color = new RGBAColor (
            this.StringToInteger (paramParts[0]),
            this.StringToInteger (paramParts[1]),
            this.StringToInteger (paramParts[2]),
            255
        );
        if (paramParts.length === 4) {
            color.a = this.StringToInteger (paramParts[3]);
        }
        return color;
    },

    EnvironmentSettingsToString (environmentSettings)
    {
        if (environmentSettings === null) {
            return null;
        }
        let environmentSettingsParameters = [
            environmentSettings.environmentMapName,
            environmentSettings.backgroundIsEnvMap ? 'on' : 'off'
        ].join (',');
        return environmentSettingsParameters;
    },

    StringToEnvironmentSettings : function (str)
    {
        if (str === null || str.length === 0) {
            return null;
        }
        let paramParts = str.split (',');
        if (paramParts.length !== 2) {
            return null;
        }
        let environmentSettings = {
            environmentMapName : paramParts[0],
            backgroundIsEnvMap : paramParts[1] === 'on' ? true : false
        };
        return environmentSettings;
    },

    EdgeSettingsToString : function (edgeSettings)
    {
        if (edgeSettings === null) {
            return null;
        }
        let edgeSettingsParameters = [
            edgeSettings.showEdges ? 'on' : 'off',
            this.RGBColorToString (edgeSettings.edgeColor),
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
        let edgeSettings = new EdgeSettings (
            paramParts[0] === 'on' ? true : false,
            new RGBColor (
                this.StringToInteger (paramParts[1]),
                this.StringToInteger (paramParts[2]),
                this.StringToInteger (paramParts[3])
            ),
            this.StringToInteger (paramParts[4])
        );
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

    AddCameraMode (cameraMode)
    {
        this.AddUrlPart ('cameramode', ParameterConverter.CameraModeToString (cameraMode));
        return this;
    }

    AddEnvironmentSettings (envSettings)
    {
        this.AddUrlPart ('envsettings', ParameterConverter.EnvironmentSettingsToString (envSettings));
        return this;
    }

    AddBackgroundColor (background)
    {
        this.AddUrlPart ('backgroundcolor', ParameterConverter.RGBAColorToString (background));
        return this;
    }

    AddDefaultColor (color)
    {
        this.AddUrlPart ('defaultcolor', ParameterConverter.RGBColorToString (color));
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

    GetCameraMode ()
    {
        let keywordParams = this.GetKeywordParams ('cameramode');
        return ParameterConverter.StringToCameraMode (keywordParams);
    }

    GetEnvironmentSettings ()
    {
        let environmentSettingsParams = this.GetKeywordParams ('envsettings');
        return ParameterConverter.StringToEnvironmentSettings (environmentSettingsParams);
    }

    GetBackgroundColor ()
    {
        let backgroundParams = this.GetKeywordParams ('backgroundcolor');
        return ParameterConverter.StringToRGBAColor (backgroundParams);
    }

    GetDefaultColor ()
    {
        let colorParams = this.GetKeywordParams ('defaultcolor');
        return ParameterConverter.StringToRGBColor (colorParams);
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
                return urlPart.substring (keywordToken.length);
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
