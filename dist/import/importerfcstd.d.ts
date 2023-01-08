export class ImporterFcstd extends ImporterBase {
    worker: Worker;
    document: FreeCadDocument;
    ConvertObjects(objects: any, onFinish: any): void;
    OnFileConverted(object: any, resultContent: any, colorToMaterial: any): void;
}
import { ImporterBase } from "./importerbase.js";
declare class FreeCadDocument {
    files: fflate.Unzipped;
    properties: PropertyGroup;
    objectNames: any[];
    objectData: Map<any, any>;
    Init(fileContent: any): number;
    GetObjectListToConvert(): any[];
    IsSupportedType(type: any): boolean;
    HasFile(fileName: any): boolean;
    LoadDocumentXml(): boolean;
    LoadGuiDocumentXml(): boolean;
    GetPropertiesFromElement(propertiesElement: any, propertyGroup: any): void;
    GetXMLContent(xmlFileName: any): Document;
    GetFirstChildValue(element: any, childTagName: any, childAttribute: any): any;
}
import * as fflate from "fflate";
import { PropertyGroup } from "../model/property.js";
export {};
//# sourceMappingURL=importerfcstd.d.ts.map