export function MatrixIsEqual(a: any, b: any): boolean;
export class Matrix {
    constructor(matrix: any);
    matrix: any;
    IsValid(): boolean;
    Set(matrix: any): Matrix;
    Get(): any;
    Clone(): Matrix;
    CreateIdentity(): Matrix;
    IsIdentity(): boolean;
    CreateTranslation(x: any, y: any, z: any): Matrix;
    CreateRotation(x: any, y: any, z: any, w: any): Matrix;
    CreateRotationAxisAngle(axis: any, angle: any): Matrix;
    CreateScale(x: any, y: any, z: any): Matrix;
    ComposeTRS(translation: any, rotation: any, scale: any): Matrix;
    DecomposeTRS(): {
        translation: Coord3D;
        rotation: Quaternion;
        scale: Coord3D;
    };
    Determinant(): number;
    Invert(): Matrix;
    Transpose(): Matrix;
    InvertTranspose(): Matrix;
    MultiplyVector(vector: any): Coord4D;
    MultiplyMatrix(matrix: any): Matrix;
}
import { Coord3D } from "./coord3d.js";
import { Quaternion } from "./quaternion.js";
import { Coord4D } from "./coord4d.js";
//# sourceMappingURL=matrix.d.ts.map