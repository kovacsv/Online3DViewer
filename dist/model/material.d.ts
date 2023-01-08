export function TextureMapIsEqual(aTex: any, bTex: any): any;
export function TextureIsEqual(a: any, b: any): boolean;
export class TextureMap {
    name: any;
    mimeType: any;
    buffer: any;
    offset: Coord2D;
    scale: Coord2D;
    rotation: number;
    IsValid(): boolean;
    HasTransformation(): boolean;
    IsEqual(rhs: any): boolean;
}
export namespace MaterialType {
    const Phong: number;
    const Physical: number;
}
export class MaterialBase {
    constructor(type: any);
    type: any;
    isDefault: boolean;
    name: string;
    color: RGBColor;
    vertexColors: boolean;
    IsEqual(rhs: any): boolean;
}
export class FaceMaterial extends MaterialBase {
    emissive: RGBColor;
    opacity: number;
    transparent: boolean;
    diffuseMap: any;
    bumpMap: any;
    normalMap: any;
    emissiveMap: any;
    alphaTest: number;
    multiplyDiffuseMap: boolean;
}
export class PhongMaterial extends FaceMaterial {
    constructor();
    ambient: RGBColor;
    specular: RGBColor;
    shininess: number;
    specularMap: any;
}
export class PhysicalMaterial extends FaceMaterial {
    constructor();
    metalness: number;
    roughness: number;
    metalnessMap: any;
}
import { Coord2D } from "../geometry/coord2d.js";
import { RGBColor } from "./color.js";
//# sourceMappingURL=material.d.ts.map