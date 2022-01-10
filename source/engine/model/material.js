import { Coord2D, CoordIsEqual2D } from '../geometry/coord2d.js';
import { IsEqual } from '../geometry/geometry.js';
import { Color, ColorIsEqual } from './color.js';

export class TextureMap
{
    constructor ()
    {
        this.name = null;
        this.url = null;
        this.buffer = null;
        this.offset = new Coord2D (0.0, 0.0);
        this.scale = new Coord2D (1.0, 1.0);
        this.rotation = 0.0; // radians
    }

    IsValid ()
    {
        return this.name !== null && this.url !== null && this.buffer !== null;
    }

    HasTransformation ()
    {
        if (!CoordIsEqual2D (this.offset, new Coord2D (0.0, 0.0))) {
            return true;
        }
        if (!CoordIsEqual2D (this.scale, new Coord2D (1.0, 1.0))) {
            return true;
        }
        if (!IsEqual (this.rotation, 0.0)) {
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
        if (!CoordIsEqual2D (this.offset, rhs.offset)) {
            return false;
        }
        if (!CoordIsEqual2D (this.scale, rhs.scale)) {
            return false;
        }
        if (!IsEqual (this.rotation, rhs.rotation)) {
            return false;
        }
        return true;
    }
}

export function TextureMapIsEqual (aTex, bTex)
{
    if (aTex === null && bTex === null) {
        return true;
    } else if (aTex === null || bTex === null) {
        return false;
    }
    return aTex.IsEqual (bTex);
}

export const MaterialType =
{
    Phong : 1,
    Physical : 2
};

export class MaterialBase
{
    constructor (type)
    {
        this.type = type;
        this.isDefault = false;

        this.name = '';
        this.color = new Color (0, 0, 0);

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
        if (!ColorIsEqual (this.color, rhs.color)) {
            return false;
        }
        if (this.vertexColors !== rhs.vertexColors) {
            return false;
        }
        return true;
    }
}

export class FaceMaterial extends MaterialBase
{
    constructor (type)
    {
        super (type);

        this.emissive = new Color (0, 0, 0);

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
        if (!ColorIsEqual (this.emissive, rhs.emissive)) {
            return false;
        }
        if (!IsEqual (this.opacity, rhs.opacity)) {
            return false;
        }
        if (this.transparent !== rhs.transparent) {
            return false;
        }
        if (!TextureMapIsEqual (this.diffuseMap, rhs.diffuseMap)) {
            return false;
        }
        if (!TextureMapIsEqual (this.bumpMap, rhs.bumpMap)) {
            return false;
        }
        if (!TextureMapIsEqual (this.normalMap, rhs.normalMap)) {
            return false;
        }
        if (!TextureMapIsEqual (this.emissiveMap, rhs.emissiveMap)) {
            return false;
        }
        if (!IsEqual (this.alphaTest, rhs.alphaTest)) {
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
}

export class PhongMaterial extends FaceMaterial
{
    constructor ()
    {
        super (MaterialType.Phong);

        this.ambient = new Color (0, 0, 0);
        this.specular = new Color (0, 0, 0);
        this.shininess = 0.0; // 0.0 .. 1.0
        this.specularMap = null;
    }

    IsEqual (rhs)
    {
        if (!super.IsEqual (rhs)) {
            return false;
        }
        if (!ColorIsEqual (this.ambient, rhs.ambient)) {
            return false;
        }
        if (!ColorIsEqual (this.specular, rhs.specular)) {
            return false;
        }
        if (!IsEqual (this.shininess, rhs.shininess)) {
            return false;
        }
        if (!TextureMapIsEqual (this.specularMap, rhs.specularMap)) {
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
}

export class PhysicalMaterial extends FaceMaterial
{
    constructor ()
    {
        super (MaterialType.Physical);

        this.metalness = 0.0; // 0.0 .. 1.0
        this.roughness = 1.0; // 0.0 .. 1.0
        this.metalnessMap = null;
    }

    IsEqual (rhs)
    {
        if (!super.IsEqual (rhs)) {
            return false;
        }
        if (!IsEqual (this.metalness, rhs.metalness)) {
            return false;
        }
        if (!IsEqual (this.roughness, rhs.roughness)) {
            return false;
        }
        if (!TextureMapIsEqual (this.metalnessMap, rhs.metalnessMap)) {
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
}

export function TextureIsEqual (a, b)
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
    if (!CoordIsEqual2D (a.offset, b.offset)) {
        return false;
    }
    if (!CoordIsEqual2D (a.scale, b.scale)) {
        return false;
    }
    if (!IsEqual (a.rotation, b.rotation)) {
        return false;
    }
    return true;
}
