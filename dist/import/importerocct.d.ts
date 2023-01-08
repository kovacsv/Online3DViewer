export class ImporterOcct extends ImporterBase {
    worker: Worker;
    ImportResultJson(resultContent: any, onFinish: any): void;
    ImportNode(resultContent: any, occtNode: any, parentNode: any, colorToMaterial: any): void;
    ImportMesh(occtMesh: any, colorToMaterial: any): import("../main.js").Mesh;
}
import { ImporterBase } from "./importerbase.js";
//# sourceMappingURL=importerocct.d.ts.map