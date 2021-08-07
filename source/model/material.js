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

OV.MaterialType =
{
    Phong : 1,
    Physical : 2
};

OV.Material = class
{
    constructor (type)
    {
        this.type = type;
        this.name = '';
        this.color = new OV.Color (0, 0, 0);

        this.ambient = new OV.Color (0, 0, 0);
        this.specular = new OV.Color (0, 0, 0);
        this.emissive = new OV.Color (0, 0, 0);

        this.metalness = 0.0;
        this.roughness = 1.0;

        this.shininess = 0.0; // 0.0 .. 1.0
        this.opacity = 1.0; // 0.0 .. 1.0

        this.diffuseMap = null;
        this.specularMap = null;
        this.bumpMap = null;
        this.normalMap = null;
        this.emissiveMap = null;
        this.metalnessMap = null;

        this.alphaTest = 0.0; // 0.0 .. 1.0
        this.transparent = false;
        this.multiplyDiffuseMap = false;
        this.multiplyMetallicMap = false;

        this.isDefault = false;
    }

    Clone ()
    {
        let cloned = new OV.Material (this.type);

        cloned.name = this.name;
        cloned.color = this.color.Clone ();

        cloned.ambient = this.ambient.Clone ();
        cloned.specular = this.specular.Clone ();
        cloned.emissive = this.emissive.Clone ();

        cloned.metalness = this.metalness;
        cloned.roughness = this.roughness;

        cloned.shininess = this.shininess;
        cloned.opacity = this.opacity;

        cloned.diffuseMap = this.CloneTextureMap (this.diffuseMap);
        cloned.specularMap = this.CloneTextureMap (this.specularMap);
        cloned.bumpMap = this.CloneTextureMap (this.bumpMap);
        cloned.normalMap = this.CloneTextureMap (this.normalMap);
        cloned.emissiveMap = this.CloneTextureMap (this.emissiveMap);
        cloned.metalnessMap = this.CloneTextureMap (this.metalnessMap);

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

OV.TextureIsEqual = function (a, b)
{
    if (a.name !== b.name) {
        return false;
    }
    if (a.name !== b.name) {
        return false;
    }
    if (a.url !== b.url) {
        return false;
    }
    if (!OV.CoordIsEqual2D (a.offset, b.offset)) {
        return false;
    }
    if (!OV.CoordIsEqual2D (a.scale, b.scale)) {
        return false;
    }
    if (!OV.IsEqual (a.rotation, b.rotation)) {
        return false;
    }
    return true;
};

OV.MaterialIsEqual = function (a, b)
{
    function TextureIsEqual (aTex, bTex)
    {
        if (aTex === null && bTex === null) {
            return true;
        } else if (aTex === null || bTex === null) {
            return false;
        }
        return OV.TextureIsEqual (aTex, bTex);
    }

    if (a.type !== b.type) {
        return false;
    }
    if (a.name !== b.name) {
        return false;
    }
    if (!OV.ColorIsEqual (a.color, b.color)) {
        return false;
    }
    if (!OV.ColorIsEqual (a.ambient, b.ambient)) {
        return false;
    }
    if (!OV.ColorIsEqual (a.specular, b.specular)) {
        return false;
    }
    if (!OV.ColorIsEqual (a.emissive, b.emissive)) {
        return false;
    }
    if (!OV.IsEqual (a.metalness, b.metalness)) {
        return false;
    }
    if (!OV.IsEqual (a.roughness, b.roughness)) {
        return false;
    }
    if (!OV.IsEqual (a.shininess, b.shininess)) {
        return false;
    }
    if (!OV.IsEqual (a.opacity, b.opacity)) {
        return false;
    }
    if (!TextureIsEqual (a.diffuseMap, b.diffuseMap)) {
        return false;
    }
    if (!TextureIsEqual (a.specularMap, b.specularMap)) {
        return false;
    }
    if (!TextureIsEqual (a.bumpMap, b.bumpMap)) {
        return false;
    }
    if (!TextureIsEqual (a.normalMap, b.normalMap)) {
        return false;
    }
    if (!TextureIsEqual (a.emissiveMap, b.emissiveMap)) {
        return false;
    }
    if (!TextureIsEqual (a.metalnessMap, b.metalnessMap)) {
        return false;
    }
    if (!OV.IsEqual (a.alphaTest, b.alphaTest)) {
        return false;
    }
    if (a.transparent !== b.transparent) {
        return false;
    }
    if (a.multiplyDiffuseMap !== b.multiplyDiffuseMap) {
        return false;
    }
    if (a.multiplyMetallicMap !== b.multiplyMetallicMap) {
        return false;
    }
    if (a.isDefault !== b.isDefault) {
        return false;
    }
    return true;
};

OV.EnumerateMaterialTextureMaps = function (material, enumerator)
{
    if (material.diffuseMap !== null) {
        enumerator (material.diffuseMap);
    }
    if (material.specularMap !== null) {
        enumerator (material.specularMap);
    }
    if (material.bumpMap !== null) {
        enumerator (material.bumpMap);
    }
    if (material.normalMap !== null) {
        enumerator (material.normalMap);
    }
    if (material.emissiveMap !== null) {
        enumerator (material.emissiveMap);
    }
    if (material.metalnessMap !== null) {
        enumerator (material.metalnessMap);
    }        
};
