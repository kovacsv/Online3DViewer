export class ImporterIfc extends ImporterBase {
    ifc: any;
    expressIDToMesh: Map<any, any>;
    colorToMaterial: ColorToMaterialConverter;
    ImportIfcContent(fileContent: any): void;
    ImportIfcMesh(modelID: any, ifcMesh: any): void;
    ImportProperties(modelID: any): void;
    GetMaterialIndexByColor(ifcColor: any): any;
    GetIFCString(ifcString: any): any;
    DecodeIFCString(ifcString: any): any;
}
import { ImporterBase } from "./importerbase.js";
import { ColorToMaterialConverter } from "./importerutils.js";
//# sourceMappingURL=importerifc.d.ts.map