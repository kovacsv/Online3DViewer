export class Importer3ds extends ImporterBase {
    materialNameToIndex: Map<any, any>;
    meshNameToIndex: Map<any, any>;
    nodeList: Importer3dsNodeList;
    ProcessBinary(fileContent: any): void;
    ReadMainChunk(reader: any, length: any): void;
    ReadEditorChunk(reader: any, length: any): void;
    ReadMaterialChunk(reader: any, length: any): void;
    ReadTextureMapChunk(reader: any, length: any): TextureMap;
    ReadColorChunk(reader: any, length: any): RGBColor;
    ReadPercentageChunk(reader: any, length: any): number;
    ReadObjectChunk(reader: any, length: any): void;
    ReadMeshChunk(reader: any, length: any, objectName: any): void;
    ReadVerticesChunk(mesh: any, reader: any): void;
    ReadTextureVerticesChunk(mesh: any, reader: any): void;
    ReadFacesChunk(mesh: any, reader: any, length: any): void;
    ReadFaceMaterialsChunk(mesh: any, reader: any): void;
    ReadFaceSmoothingGroupsChunk(mesh: any, faceCount: any, reader: any): void;
    ReadTransformationChunk(reader: any): any[];
    ReadKeyFrameChunk(reader: any, length: any): void;
    BuildNodeHierarchy(): void;
    ReadObjectNodeChunk(reader: any, length: any): void;
    ReadName(reader: any): string;
    ReadVector(reader: any): any[];
    ReadChunks(reader: any, endByte: any, onChunk: any): void;
    GetChunkEnd(reader: any, length: any): number;
    SkipChunk(reader: any, length: any): void;
}
import { ImporterBase } from "./importerbase.js";
declare class Importer3dsNodeList {
    nodes: any[];
    nodeIdToNode: Map<any, any>;
    IsEmpty(): boolean;
    AddNode(node: any): void;
    GetNodes(): any[];
}
import { TextureMap } from "../model/material.js";
import { RGBColor } from "../model/color.js";
export {};
//# sourceMappingURL=importer3ds.d.ts.map