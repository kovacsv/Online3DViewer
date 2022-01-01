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

    IsEqual (rhs)
    {
        if (this.name !== rhs.name) {
            return false;
        }
        if (this.name !== rhs.name) {
            return false;
        }
        if (this.url !== rhs.url) {
            return false;
        }
        if (!OV.CoordIsEqual2D (this.offset, rhs.offset)) {
            return false;
        }
        if (!OV.CoordIsEqual2D (this.scale, rhs.scale)) {
            return false;
        }
        if (!OV.IsEqual (this.rotation, rhs.rotation)) {
            return false;
        }
        return true;
    }
};

OV.TextureMapIsEqual = function (aTex, bTex)
{
    if (aTex === null && bTex === null) {
        return true;
    } else if (aTex === null || bTex === null) {
        return false;
    }
    return aTex.IsEqual (bTex);
};

OV.MaterialType =
{
    Phong : 1,
    Physical : 2
};

OV.MaterialBase = class
{
    constructor (type)
    {
        this.type = type;
        this.isDefault = false;

        this.name = '';
        this.color = new OV.Color (0, 0, 0);

        this.vertexColors = false;
    }

    IsEqual (rhs)
    {
        if (this.type !== rhs.type) {
            return false;
        }
        if (this.isDefault !== rhs.isDefault) {
            return false;
        }
        if (this.name !== rhs.name) {
            return false;
        }
        if (!OV.ColorIsEqual (this.color, rhs.color)) {
            return false;
        }
        if (this.vertexColors !== rhs.vertexColors) {
            return false;
        }
        return true;
    }
};

OV.FaceMaterial = class extends OV.MaterialBase
{
    constructor (type)
    {
        super (type);

        this.emissive = new OV.Color (0, 0, 0);

        this.opacity = 1.0; // 0.0 .. 1.0
        this.transparent = false;

        this.diffuseMap = null;
        this.bumpMap = null;
        this.normalMap = null;
        this.emissiveMap = null;

        this.alphaTest = 0.0; // 0.0 .. 1.0
        this.multiplyDiffuseMap = false;
    }

    IsEqual (rhs)
    {
        if (!super.IsEqual (rhs)) {
            return false;
        }
        if (!OV.ColorIsEqual (this.emissive, rhs.emissive)) {
            return false;
        }
        if (!OV.IsEqual (this.opacity, rhs.opacity)) {
            return false;
        }
        if (this.transparent !== rhs.transparent) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.diffuseMap, rhs.diffuseMap)) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.bumpMap, rhs.bumpMap)) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.normalMap, rhs.normalMap)) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.emissiveMap, rhs.emissiveMap)) {
            return false;
        }
        if (!OV.IsEqual (this.alphaTest, rhs.alphaTest)) {
            return false;
        }
        if (this.multiplyDiffuseMap !== rhs.multiplyDiffuseMap) {
            return false;
        }
        return true;
    }

    EnumerateTextureMaps (enumerator)
    {
        if (this.diffuseMap !== null) {
            enumerator (this.diffuseMap);
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
};

OV.PhongMaterial = class extends OV.FaceMaterial
{
    constructor ()
    {
        super (OV.MaterialType.Phong);

        this.ambient = new OV.Color (0, 0, 0);
        this.specular = new OV.Color (0, 0, 0);
        this.shininess = 0.0; // 0.0 .. 1.0
        this.specularMap = null;
    }

    IsEqual (rhs)
    {
        if (!super.IsEqual (rhs)) {
            return false;
        }
        if (!OV.ColorIsEqual (this.ambient, rhs.ambient)) {
            return false;
        }
        if (!OV.ColorIsEqual (this.specular, rhs.specular)) {
            return false;
        }
        if (!OV.IsEqual (this.shininess, rhs.shininess)) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.specularMap, rhs.specularMap)) {
            return false;
        }
        return true;
    }

    EnumerateTextureMaps (enumerator)
    {
        super.EnumerateTextureMaps (enumerator);
        if (this.specularMap !== null) {
            enumerator (this.specularMap);
        }
    }
};

OV.PhysicalMaterial = class extends OV.FaceMaterial
{
    constructor ()
    {
        super (OV.MaterialType.Physical);

        this.metalness = 0.0; // 0.0 .. 1.0
        this.roughness = 1.0; // 0.0 .. 1.0
        this.metalnessMap = null;
    }

    IsEqual (rhs)
    {
        if (!super.IsEqual (rhs)) {
            return false;
        }
        if (!OV.IsEqual (this.metalness, rhs.metalness)) {
            return false;
        }
        if (!OV.IsEqual (this.roughness, rhs.roughness)) {
            return false;
        }
        if (!OV.TextureMapIsEqual (this.metalnessMap, rhs.metalnessMap)) {
            return false;
        }
        return true;
    }

    EnumerateTextureMaps (enumerator)
    {
        super.EnumerateTextureMaps (enumerator);
        if (this.metalnessMap !== null) {
            enumerator (this.metalnessMap);
        }
    }
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
