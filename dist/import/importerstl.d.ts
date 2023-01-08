export class ImporterStl extends ImporterBase {
    mesh: Mesh;
    triangle: Triangle;
    IsBinaryStlFile(fileContent: any): boolean;
    ProcessLine(line: any): void;
    ProcessBinary(fileContent: any): void;
}
import { ImporterBase } from "./importerbase.js";
import { Mesh } from "../model/mesh.js";
import { Triangle } from "../model/triangle.js";
//# sourceMappingURL=importerstl.d.ts.map