export class ExporterSettings {
    constructor(settings: any);
    transformation: Transformation;
    isMeshVisible: (meshInstanceId: any) => boolean;
}
export class ExporterModel {
    constructor(model: any, settings: any);
    model: any;
    settings: any;
    GetModel(): any;
    MaterialCount(): any;
    GetMaterial(index: any): any;
    VertexCount(): number;
    TriangleCount(): number;
    MeshInstanceCount(): number;
    EnumerateMeshInstances(onMeshInstance: any): void;
    EnumerateTransformedMeshes(onMesh: any): void;
    EnumerateVerticesAndTriangles(callbacks: any): void;
    EnumerateTrianglesWithNormals(onTriangle: any): void;
}
import { Transformation } from "../geometry/transformation.js";
//# sourceMappingURL=exportermodel.d.ts.map