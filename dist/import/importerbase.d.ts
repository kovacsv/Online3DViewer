export class ImporterBase {
    name: any;
    extension: any;
    callbacks: any;
    model: Model;
    error: boolean;
    message: any;
    Import(name: any, extension: any, content: any, callbacks: any): void;
    Clear(): void;
    CreateResult(callbacks: any): void;
    CanImportExtension(extension: any): boolean;
    GetUpDirection(): number;
    ClearContent(): void;
    ResetContent(): void;
    ImportContent(fileContent: any, onFinish: any): void;
    GetModel(): Model;
    SetError(message: any): void;
    WasError(): boolean;
    GetErrorMessage(): any;
}
import { Model } from "../model/model.js";
//# sourceMappingURL=importerbase.d.ts.map