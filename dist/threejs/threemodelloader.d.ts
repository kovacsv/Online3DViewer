export class ThreeModelLoader {
    importer: Importer;
    inProgress: boolean;
    defaultMaterial: any;
    objectUrls: any[];
    hasHighpDriverIssue: boolean;
    InProgress(): boolean;
    LoadModel(inputFiles: any, settings: any, callbacks: any): void;
    GetImporter(): Importer;
    GetDefaultMaterial(): any;
    ReplaceDefaultMaterialColor(defaultColor: any): void;
    RevokeObjectUrls(): void;
    Destroy(): void;
}
import { Importer } from "../import/importer.js";
//# sourceMappingURL=threemodelloader.d.ts.map