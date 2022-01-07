OV.Color = class
{
    constructor (r, g, b)
    {
        this.r = r; // 0 .. 255
        this.g = g; // 0 .. 255
        this.b = b; // 0 .. 255
    }

    Set (r, g, b)
    {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    Clone ()
    {
        return new OV.Color (this.r, this.g, this.b);
    }
};

OV.ColorComponentFromFloat = function (component)
{
    return parseInt (Math.round (component * 255.0), 10);
};

OV.ColorFromFloatComponents = function (r, g, b)
{
    return new OV.Color (
        OV.ColorComponentFromFloat (r),
        OV.ColorComponentFromFloat (g),
        OV.ColorComponentFromFloat (b)
    );
};

OV.SRGBToLinear = function (component)
{
    if (component < 0.04045) {
        return component * 0.0773993808;
    } else {
        return Math.pow (component * 0.9478672986 + 0.0521327014, 2.4);
    }
};

OV.LinearToSRGB = function (component)
{
    if (component < 0.0031308) {
        return component * 12.92;
    } else {
        return 1.055 * (Math.pow (component, 0.41666)) - 0.055;
    }
};

OV.IntegerToHexString = function (intVal)
{
    let result = parseInt (intVal, 10).toString (16);
    while (result.length < 2) {
        result = '0' + result;
    }
    return result;
};

OV.ColorToHexString = function (color)
{
    let r = OV.IntegerToHexString (color.r);
    let g = OV.IntegerToHexString (color.g);
    let b = OV.IntegerToHexString (color.b);
    return r + g + b;
};

OV.HexStringToColor = function (hexString)
{
    if (hexString.length !== 6) {
        return null;
    }

    let r = parseInt (hexString.substr (0, 2), 16);
    let g = parseInt (hexString.substr (2, 2), 16);
    let b = parseInt (hexString.substr (4, 2), 16);
    return new OV.Color (r, g, b);
};

OV.ArrayToColor = function (arr)
{
	return new OV.Color (arr[0], arr[1], arr[2]);
};

OV.ColorIsEqual = function (a, b)
{
	return a.r === b.r && a.g === b.g && a.b === b.b;
};
