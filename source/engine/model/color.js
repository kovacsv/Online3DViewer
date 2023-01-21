/**
 * RGB color object. Components are integers in the range of 0..255.
 */
export class RGBColor
{
    /**
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     */
    constructor (r, g, b)
    {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Sets the value of all components.
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     */
    Set (r, g, b)
    {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Creates a clone of the object.
     * @returns {RGBColor}
     */
    Clone ()
    {
        return new RGBColor (this.r, this.g, this.b);
    }
}

/**
 * RGBA color object. Components are integers in the range of 0..255.
 */
export class RGBAColor
{
    /**
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     * @param {integer} a Alpha component.
     */
    constructor (r, g, b, a)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * Sets the value of all components.
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     * @param {integer} a Alpha component.
     */
    Set (r, g, b, a)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * Creates a clone of the object.
     * @returns {RGBAColor}
     */
    Clone ()
    {
        return new RGBAColor (this.r, this.g, this.b, this.a);
    }
}

export function ColorComponentFromFloat (component)
{
    return parseInt (Math.round (component * 255.0), 10);
}

export function ColorComponentToFloat (component)
{
    return component / 255.0;
}

export function RGBColorFromFloatComponents (r, g, b)
{
    return new RGBColor (
        ColorComponentFromFloat (r),
        ColorComponentFromFloat (g),
        ColorComponentFromFloat (b)
    );
}

export function SRGBToLinear (component)
{
    if (component < 0.04045) {
        return component * 0.0773993808;
    } else {
        return Math.pow (component * 0.9478672986 + 0.0521327014, 2.4);
    }
}

export function LinearToSRGB (component)
{
    if (component < 0.0031308) {
        return component * 12.92;
    } else {
        return 1.055 * (Math.pow (component, 0.41666)) - 0.055;
    }
}

export function IntegerToHexString (intVal)
{
    let result = parseInt (intVal, 10).toString (16);
    while (result.length < 2) {
        result = '0' + result;
    }
    return result;
}

export function RGBColorToHexString (color)
{
    let r = IntegerToHexString (color.r);
    let g = IntegerToHexString (color.g);
    let b = IntegerToHexString (color.b);
    return r + g + b;
}

export function RGBAColorToHexString (color)
{
    let r = IntegerToHexString (color.r);
    let g = IntegerToHexString (color.g);
    let b = IntegerToHexString (color.b);
    let a = IntegerToHexString (color.a);
    return r + g + b + a;
}

export function HexStringToRGBColor (hexString)
{
    if (hexString.length !== 6) {
        return null;
    }

    let r = parseInt (hexString.substring (0, 2), 16);
    let g = parseInt (hexString.substring (2, 4), 16);
    let b = parseInt (hexString.substring (4, 6), 16);
    return new RGBColor (r, g, b);
}

export function HexStringToRGBAColor (hexString)
{
    if (hexString.length !== 6 && hexString.length !== 8) {
        return null;
    }

    let r = parseInt (hexString.substring (0, 2), 16);
    let g = parseInt (hexString.substring (2, 4), 16);
    let b = parseInt (hexString.substring (4, 6), 16);
    let a = 255;
    if (hexString.length === 8) {
        a = parseInt (hexString.substring (6, 8), 16);
    }
    return new RGBAColor (r, g, b, a);
}

export function ArrayToRGBColor (arr)
{
	return new RGBColor (arr[0], arr[1], arr[2]);
}

export function RGBColorIsEqual (a, b)
{
	return a.r === b.r && a.g === b.g && a.b === b.b;
}
