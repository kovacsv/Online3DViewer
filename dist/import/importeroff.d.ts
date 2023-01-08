export class ImporterOff extends ImporterBase {
    mesh: Mesh;
    status: {
        vertexCount: number;
        faceCount: number;
        foundVertex: number;
        foundFace: number;
    };
    colorToMaterial: ColorToMaterialConverter;
    ProcessLine(line: any): void;
}
import { ImporterBase } from "./importerbase.js";
import { Mesh } from "../model/mesh.js";
import { ColorToMaterialConverter } from "./importerutils.js";
//# sourceMappingURL=importeroff.d.ts.map