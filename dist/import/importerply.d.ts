export class ImporterPly extends ImporterBase {
    mesh: Mesh;
    GetHeaderContent(fileContent: any): string;
    ReadHeader(headerContent: any): PlyHeader;
    ReadAsciiContent(header: any, fileContent: any): void;
    ReadBinaryContent(header: any, fileContent: any, headerLength: any): void;
}
import { ImporterBase } from "./importerbase.js";
import { Mesh } from "../model/mesh.js";
declare class PlyHeader {
    format: any;
    elements: any[];
    SetFormat(format: any): void;
    AddElement(name: any, count: any): void;
    GetElements(): any[];
    AddSingleFormat(elemType: any, name: any): void;
    AddListFormat(countType: any, elemType: any, name: any): void;
    GetElement(name: any): any;
    Check(): number;
}
export {};
//# sourceMappingURL=importerply.d.ts.map