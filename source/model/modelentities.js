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

OV.Color = class
{
    constructor (r, g, b)
    {
        this.r = r; // 0 .. 255
        this.g = g; // 0 .. 255
        this.b = b; // 0 .. 255
    }

    ToHexString ()
    {
        function IntegerToHex (intVal)
        {
            let result = parseInt (intVal, 10).toString (16);
            while (result.length < 2) {
                result = '0' + result;
            }
            return result;
        }

        let r = IntegerToHex (this.r);
        let g = IntegerToHex (this.g);
        let b = IntegerToHex (this.b);
        return r + g + b;
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

OV.Triangle = class
{
    constructor (v0, v1, v2)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    
        this.n0 = null;
        this.n1 = null;
        this.n2 = null;
    
        this.u0 = null;
        this.u1 = null;
        this.u2 = null;
    
        this.mat = null;
        this.curve = null;
    }

    HasVertices ()
    {
        return this.v0 !== null && this.v1 !== null && this.v2 !== null;
    }

    HasNormals ()
    {
        return this.n0 !== null && this.n1 !== null && this.n2 !== null;
    }

    HasTextureUVs ()
    {
        return this.u0 !== null && this.u1 !== null && this.u2 !== null;
    }    

    SetVertices (v0, v1, v2)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        return this;
    }
    
    SetNormals (n0, n1, n2)
    {
        this.n0 = n0;
        this.n1 = n1;
        this.n2 = n2;
        return this;
    }
    
    SetTextureUVs (u0, u1, u2)
    {
        this.u0 = u0;
        this.u1 = u1;
        this.u2 = u2;
        return this;
    }

    SetMaterial (mat)
    {
        this.mat = mat;
        return this;
    }
    
    SetCurve (curve)
    {
        this.curve = curve;
        return this;
    }

    Clone ()
    {
        let cloned = new OV.Triangle (this.v0, this.v1, this.v2);
        cloned.SetNormals (this.n0, this.n1, this.n2);
        cloned.SetTextureUVs (this.u0, this.u1, this.u2);
        cloned.SetMaterial (this.mat);
        cloned.SetCurve (this.curve);
        return cloned;
    }
};
