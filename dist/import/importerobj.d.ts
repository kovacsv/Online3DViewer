export class ImporterObj extends ImporterBase {
    globalVertices: any[];
    globalVertexColors: any[];
    globalNormals: any[];
    globalUvs: any[];
    currentMeshConverter: any;
    currentMaterial: PhongMaterial;
    currentMaterialIndex: any;
    meshNameToConverter: Map<any, any>;
    materialNameToIndex: Map<any, any>;
    ProcessLine(line: any): void;
    AddNewMesh(name: any): void;
    ProcessMeshParameter(keyword: any, parameters: any, line: any): boolean;
    ProcessMaterialParameter(keyword: any, parameters: any, line: any): boolean;
    ProcessFace(parameters: any): void;
}
import { ImporterBase } from "./importerbase.js";
import { PhongMaterial } from "../model/material.js";
//# sourceMappingURL=importerobj.d.ts.map