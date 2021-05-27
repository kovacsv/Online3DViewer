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

OV.TextureMap = class
{
    constructor ()
    {
        this.name = null;
        this.url = null;
        this.buffer = null;
        this.offset = new OV.Coord2D (0.0, 0.0);
        this.scale = new OV.Coord2D (1.0, 1.0);
        this.rotation = 0.0; // radians
    }

    IsValid ()
    {
        return this.name !== null && this.url !== null && this.buffer !== null;
    }

    HasTransformation ()
    {
        if (!OV.CoordIsEqual2D (this.offset, new OV.Coord2D (0.0, 0.0))) {
            return true;
        }
        if (!OV.CoordIsEqual2D (this.scale, new OV.Coord2D (1.0, 1.0))) {
            return true;
        }
        if (!OV.IsEqual (this.rotation, 0.0)) {
            return true;
        }
        return false;
    }

    Clone ()
    {
        let cloned = new OV.TextureMap ();
        cloned.name = this.name;
        cloned.url = this.url;
        cloned.buffer = this.buffer;
        cloned.offset = this.offset.Clone ();
        cloned.scale = this.scale.Clone ();
        cloned.rotation = this.rotation;
        return cloned;
    }
};

OV.Material = class
{
    constructor ()
    {
        this.name = '';

        this.ambient = new OV.Color (0, 0, 0);
        this.diffuse = new OV.Color (0, 0, 0);
        this.specular = new OV.Color (0, 0, 0);
        this.emissive = new OV.Color (0, 0, 0);

        this.shininess = 0.0; // 0.0 .. 1.0
        this.opacity = 1.0; // 0.0 .. 1.0

        this.diffuseMap = null;
        this.specularMap = null;
        this.bumpMap = null;
        this.normalMap = null;
        this.emissiveMap = null;

        this.alphaTest = 0.0; // 0.0 .. 1.0
        this.transparent = false;
        this.multiplyDiffuseMap = false;
    }

    EnumerateTextureMaps (enumerator)
    {
        if (this.diffuseMap !== null) {
            enumerator (this.diffuseMap);
        }
        if (this.specularMap !== null) {
            enumerator (this.specularMap);
        }
        if (this.bumpMap !== null) {
            enumerator (this.bumpMap);
        }
        if (this.normalMap !== null) {
            enumerator (this.normalMap);
        }
        if (this.emissiveMap !== null) {
            enumerator (this.emissiveMap);
        }
    }

    Clone ()
    {
        let cloned = new OV.Material ();

        cloned.name = this.name;

        cloned.ambient = this.ambient.Clone ();
        cloned.diffuse = this.diffuse.Clone ();
        cloned.specular = this.specular.Clone ();
        cloned.emissive = this.emissive.Clone ();

        cloned.shininess = this.shininess;
        cloned.opacity = this.opacity;

        cloned.diffuseMap = this.CloneTextureMap (this.diffuseMap);
        cloned.specularMap = this.CloneTextureMap (this.specularMap);
        cloned.bumpMap = this.CloneTextureMap (this.bumpMap);
        cloned.normalMap = this.CloneTextureMap (this.normalMap);
        cloned.emissiveMap = this.CloneTextureMap (this.emissiveMap);

        cloned.alphaTest = this.alphaTest;
        cloned.transparent = this.transparent;
        cloned.multiplyDiffuseMap = this.multiplyDiffuseMap;

        return cloned;
    }

    CloneTextureMap (textureMap)
    {
        if (textureMap === null) {
            return null;
        }
        return textureMap.Clone ();
    }
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

OV.ColorToHexString = function (color)
{
    function IntegerToHex (intVal)
    {
        let result = parseInt (intVal, 10).toString (16);
        while (result.length < 2) {
            result = '0' + result;
        }
        return result;
    }

    let r = IntegerToHex (color.r);
    let g = IntegerToHex (color.g);
    let b = IntegerToHex (color.b);
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

OV.ColorIsEqual = function (a, b)
{
	return a.r === b.r && a.g === b.g && a.b === b.b;
};

OV.ArrayToColor = function (arr)
{
	return new OV.Color (arr[0], arr[1], arr[2]);
};
