export class ImporterGltf extends ImporterBase {
    gltfExtensions: GltfExtensions;
    bufferContents: any[];
    imageIndexToTextureParams: Map<any, any>;
    ProcessGltf(fileContent: any, onFinish: any): void;
    ProcessBinaryGltf(fileContent: any, onFinish: any): void;
    ProcessMainFile(gltf: any, onFinish: any): void;
    ImportModel(gltf: any): void;
    ImportModelProperties(gltf: any): void;
    GetDefaultScene(gltf: any): any;
    ImportMaterial(gltf: any, gltfMaterial: any): void;
    ImportTexture(gltf: any, gltfTextureRef: any): TextureMap;
    ImportMesh(gltf: any, gltfMesh: any): void;
    ImportPrimitive(gltf: any, primitive: any, mesh: any): void;
    AddTriangle(primitive: any, mesh: any, v0: any, v1: any, v2: any, hasVertexColors: any, hasNormals: any, hasUVs: any, vertexOffset: any, vertexColorOffset: any, normalOffset: any, uvOffset: any): void;
    ImportNodes(gltf: any): void;
    ImportNode(gltf: any, gltfNode: any, parentNode: any): void;
    GetReaderFromBufferView(bufferView: any): GltfBufferReader;
    GetReaderFromAccessor(gltf: any, accessor: any): GltfBufferReader;
    GetReaderFromSparseAccessor(gltf: any, sparseAccessor: any, componentType: any, type: any, count: any): GltfBufferReader;
}
import { ImporterBase } from "./importerbase.js";
declare class GltfExtensions {
    supportedExtensions: string[];
    draco: any;
    LoadLibraries(extensionsRequired: any, callbacks: any): void;
    GetUnsupportedExtensions(extensionsRequired: any): any[];
    ProcessMaterial(gltfMaterial: any, material: any, imporTextureFn: any): PhongMaterial;
    ProcessTexture(gltfTexture: any, texture: any): void;
    ProcessPrimitive(importer: any, gltf: any, primitive: any, mesh: any): boolean;
}
import { TextureMap } from "../model/material.js";
declare class GltfBufferReader {
    constructor(buffer: any);
    reader: BinaryReader;
    componentType: any;
    dataType: number;
    byteStride: any;
    dataCount: any;
    sparseReader: {
        indexReader: any;
        valueReader: any;
    };
    SetComponentType(componentType: any): void;
    SetDataType(dataType: any): void;
    SetByteStride(byteStride: any): void;
    SetDataCount(dataCount: any): void;
    SetSparseReader(indexReader: any, valueReader: any): void;
    ReadArrayBuffer(byteLength: any): ArrayBuffer;
    GetDataCount(): any;
    ReadData(): number | Coord2D | Coord3D | Coord4D;
    EnumerateData(onData: any): void;
    SkipBytes(bytes: any): void;
    ReadComponent(): number;
    SkipBytesByStride(componentCount: any): void;
    GetComponentSize(): 0 | 1 | 2 | 4;
}
import { PhongMaterial } from "../model/material.js";
import { BinaryReader } from "../io/binaryreader.js";
import { Coord2D } from "../geometry/coord2d.js";
import { Coord3D } from "../geometry/coord3d.js";
import { Coord4D } from "../geometry/coord4d.js";
export {};
//# sourceMappingURL=importergltf.d.ts.map