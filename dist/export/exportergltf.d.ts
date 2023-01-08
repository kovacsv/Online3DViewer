export class ExporterGltf extends ExporterBase {
    components: {
        index: {
            type: number;
            size: number;
        };
        number: {
            type: number;
            size: number;
        };
    };
    ExportAsciiContent(exporterModel: any, files: any): void;
    ExportBinaryContent(exporterModel: any, files: any): void;
    GetMeshData(exporterModel: any): any[];
    GetMainBuffer(meshDataArr: any): ArrayBuffer;
    GetMainJson(meshDataArr: any): {
        asset: {
            generator: string;
            version: string;
        };
        scene: number;
        scenes: {
            nodes: any[];
        }[];
        nodes: any[];
        materials: any[];
        meshes: any[];
        buffers: any[];
        bufferViews: any[];
        accessors: any[];
    };
    ExportMaterials(exporterModel: any, mainJson: any, addTexture: any): void;
}
import { ExporterBase } from "./exporterbase.js";
//# sourceMappingURL=exportergltf.d.ts.map