export class ImporterThreeBase extends ImporterBase {
    CreateLoader(manager: any): any;
    GetMainObject(loadedObject: any): any;
    IsMeshVisible(mesh: any): boolean;
    loader: any;
    materialIdToIndex: Map<any, any>;
    objectUrlToFileName: Map<any, any>;
    LoadModel(fileContent: any, onFinish: any): void;
    OnThreeObjectsLoaded(loadedObject: any, onFinish: any): void;
    ConvertThreeMesh(threeMesh: any): import("../main.js").Mesh;
    FindOrCreateMaterial(threeMaterial: any): any;
    ConvertThreeMaterial(threeMaterial: any): PhongMaterial;
}
export class ImporterThreeFbx extends ImporterThreeBase {
}
export class ImporterThreeDae extends ImporterThreeBase {
}
export class ImporterThreeWrl extends ImporterThreeBase {
}
export class ImporterThree3mf extends ImporterThreeBase {
}
import { ImporterBase } from "./importerbase.js";
import { PhongMaterial } from "../model/material.js";
//# sourceMappingURL=importerthree.d.ts.map