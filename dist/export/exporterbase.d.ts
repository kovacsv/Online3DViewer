export class ExportedFile {
    constructor(name: any);
    name: any;
    content: any;
    GetName(): any;
    SetName(name: any): void;
    GetTextContent(): string;
    GetBufferContent(): any;
    SetTextContent(content: any): void;
    SetBufferContent(content: any): void;
}
export class ExporterBase {
    CanExport(format: any, extension: any): boolean;
    Export(exporterModel: any, format: any, onFinish: any): void;
    ExportContent(exporterModel: any, format: any, files: any, onFinish: any): void;
    GetExportedMaterialName(originalName: any): any;
    GetExportedMeshName(originalName: any): any;
    GetExportedName(originalName: any, defaultName: any): any;
}
//# sourceMappingURL=exporterbase.d.ts.map