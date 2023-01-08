export class Box3D {
    constructor(min: any, max: any);
    min: any;
    max: any;
    GetMin(): any;
    GetMax(): any;
    GetCenter(): Coord3D;
}
export class BoundingBoxCalculator3D {
    box: Box3D;
    isValid: boolean;
    GetBox(): Box3D;
    AddPoint(point: any): void;
}
import { Coord3D } from "./coord3d.js";
//# sourceMappingURL=box3d.d.ts.map