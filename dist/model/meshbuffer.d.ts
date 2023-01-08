export function ConvertMeshToMeshBuffer(mesh: any): MeshBuffer;
export class MeshPrimitiveBuffer {
    indices: any[];
    vertices: any[];
    colors: any[];
    normals: any[];
    uvs: any[];
    material: any;
    GetBounds(): {
        min: number[];
        max: number[];
    };
    GetByteLength(indexTypeSize: any, numberTypeSize: any): number;
}
export class MeshBuffer {
    primitives: any[];
    PrimitiveCount(): number;
    GetPrimitive(index: any): any;
    GetByteLength(indexTypeSize: any, numberTypeSize: any): number;
}
//# sourceMappingURL=meshbuffer.d.ts.map