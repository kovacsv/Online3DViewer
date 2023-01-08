export class Mesh extends ModelObject3D {
    vertices: any[];
    vertexColors: any[];
    normals: any[];
    uvs: any[];
    triangles: any[];
    AddVertex(vertex: any): number;
    SetVertex(index: any, vertex: any): void;
    GetVertex(index: any): any;
    AddVertexColor(color: any): number;
    SetVertexColor(index: any, color: any): void;
    GetVertexColor(index: any): any;
    AddNormal(normal: any): number;
    SetNormal(index: any, normal: any): void;
    GetNormal(index: any): any;
    AddTextureUV(uv: any): number;
    SetTextureUV(index: any, uv: any): void;
    GetTextureUV(index: any): any;
    AddTriangle(triangle: any): number;
    GetTriangle(index: any): any;
    Clone(): Mesh;
}
import { ModelObject3D } from "./object.js";
//# sourceMappingURL=mesh.d.ts.map