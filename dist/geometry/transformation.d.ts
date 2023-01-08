export function TransformationIsEqual(a: any, b: any): boolean;
export class Transformation {
    constructor(matrix: any);
    matrix: any;
    SetMatrix(matrix: any): Transformation;
    GetMatrix(): any;
    IsIdentity(): any;
    AppendMatrix(matrix: any): Transformation;
    Append(transformation: any): Transformation;
    TransformCoord3D(coord: any): Coord3D;
    Clone(): Transformation;
}
import { Coord3D } from "./coord3d.js";
//# sourceMappingURL=transformation.d.ts.map