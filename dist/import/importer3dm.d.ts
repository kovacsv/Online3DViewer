export class Importer3dm extends ImporterBase {
    rhino: any;
    instanceIdToObject: Map<any, any>;
    instanceIdToDefinition: Map<any, any>;
    ImportRhinoContent(fileContent: any): void;
    ImportRhinoDocument(rhinoDoc: any): void;
    InitRhinoInstances(rhinoDoc: any): void;
    ImportRhinoUserStrings(rhinoDoc: any): void;
    ImportRhinoGeometry(rhinoDoc: any): void;
    ImportRhinoGeometryObject(rhinoDoc: any, rhinoObject: any, rhinoInstanceReferences: any): void;
    ImportRhinoMesh(rhinoDoc: any, rhinoMesh: any, rhinoObject: any, rhinoInstanceReferences: any): void;
    GetMaterialIndex(rhinoDoc: any, rhinoObject: any, rhinoInstanceReferences: any): any;
}
import { ImporterBase } from "./importerbase.js";
//# sourceMappingURL=importer3dm.d.ts.map