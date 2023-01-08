export function GenerateCuboid(genParams: any, xSize: any, ySize: any, zSize: any): Mesh;
export function GenerateCone(genParams: any, topRadius: any, bottomRadius: any, height: any, segments: any, smooth: any): Mesh;
export function GenerateCylinder(genParams: any, radius: any, height: any, segments: any, smooth: any): Mesh;
export function GenerateSphere(genParams: any, radius: any, segments: any, smooth: any): Mesh;
export function GeneratePlatonicSolid(genParams: any, type: any, radius: any): Mesh;
export class GeneratorParams {
    name: any;
    material: any;
    SetName(name: any): GeneratorParams;
    SetMaterial(material: any): GeneratorParams;
}
export class Generator {
    constructor(params: any);
    params: any;
    mesh: Mesh;
    curve: any;
    GetMesh(): Mesh;
    AddVertex(x: any, y: any, z: any): number;
    AddVertices(vertices: any): number[];
    SetCurve(curve: any): void;
    ResetCurve(): void;
    AddTriangle(v0: any, v1: any, v2: any): number;
    AddTriangleInverted(v0: any, v1: any, v2: any): void;
    AddConvexPolygon(vertices: any): void;
    AddConvexPolygonInverted(vertices: any): void;
}
export class GeneratorHelper {
    constructor(generator: any);
    generator: any;
    GenerateSurfaceBetweenPolygons(startIndices: any, endIndices: any): void;
    GenerateTriangleFan(startIndices: any, endIndex: any): void;
}
import { Mesh } from "./mesh.js";
//# sourceMappingURL=generator.d.ts.map