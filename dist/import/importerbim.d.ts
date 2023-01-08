export class ImporterBim extends ImporterBase {
    meshIdToMesh: Map<any, any>;
    colorToMaterial: ColorToMaterialConverter;
    ImportElement(bimElement: any): Mesh;
    ImportMesh(bimMesh: any, getMaterialIndex: any): Mesh;
    ImportProperties(source: any, target: any): void;
}
import { ImporterBase } from "./importerbase.js";
import { ColorToMaterialConverter } from "./importerutils.js";
import { Mesh } from "../model/mesh.js";
//# sourceMappingURL=importerbim.d.ts.map