export function CoordIsEqual3D(a: any, b: any): boolean;
export function AddCoord3D(a: any, b: any): Coord3D;
export function SubCoord3D(a: any, b: any): Coord3D;
export function CoordDistance3D(a: any, b: any): number;
export function DotVector3D(a: any, b: any): number;
export function VectorAngle3D(a: any, b: any): number;
export function CrossVector3D(a: any, b: any): Coord3D;
export function VectorLength3D(x: any, y: any, z: any): number;
export function ArrayToCoord3D(arr: any): Coord3D;
export class Coord3D {
    constructor(x: any, y: any, z: any);
    x: any;
    y: any;
    z: any;
    Length(): number;
    MultiplyScalar(scalar: any): Coord3D;
    Normalize(): Coord3D;
    Offset(direction: any, distance: any): Coord3D;
    Rotate(axis: any, angle: any, origo: any): Coord3D;
    Clone(): Coord3D;
}
//# sourceMappingURL=coord3d.d.ts.map