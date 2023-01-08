export class ImportSettings {
    defaultColor: RGBColor;
}
export namespace ImportErrorCode {
    const NoImportableFile: number;
    const FailedToLoadFile: number;
    const ImportFailed: number;
    const UnknownError: number;
}
export class ImportError {
    constructor(code: any);
    code: any;
    mainFile: any;
    message: any;
}
export class ImportResult {
    model: any;
    mainFile: any;
    upVector: any;
    usedFiles: any;
    missingFiles: any;
}
export class ImporterFileAccessor {
    constructor(getBufferCallback: any);
    getBufferCallback: any;
    fileBuffers: Map<any, any>;
    GetFileBuffer(filePath: any): any;
}
export class Importer {
    importers: (Importer3dm | Importer3ds | ImporterGltf | ImporterIfc | ImporterObj | ImporterOff | ImporterPly | ImporterOcct | ImporterStl | ImporterBim | ImporterThreeFbx | ImporterThreeDae | ImporterThreeWrl | ImporterThree3mf | ImporterFcstd)[];
    fileList: ImporterFileList;
    model: any;
    usedFiles: any[];
    missingFiles: any[];
    AddImporter(importer: any): void;
    ImportFiles(inputFiles: any, settings: any, callbacks: any): void;
    LoadFiles(inputFiles: any, callbacks: any): void;
    ImportLoadedFiles(settings: any, callbacks: any): void;
    ImportLoadedMainFile(mainFile: any, settings: any, callbacks: any): void;
    DecompressArchives(fileList: any, onReady: any): void;
    GetFileList(): ImporterFileList;
    HasImportableFile(fileList: any): boolean;
    GetImportableFiles(fileList: any): {
        file: any;
        importer: any;
    }[];
}
import { RGBColor } from "../model/color.js";
import { Importer3dm } from "./importer3dm.js";
import { Importer3ds } from "./importer3ds.js";
import { ImporterGltf } from "./importergltf.js";
import { ImporterIfc } from "./importerifc.js";
import { ImporterObj } from "./importerobj.js";
import { ImporterOff } from "./importeroff.js";
import { ImporterPly } from "./importerply.js";
import { ImporterOcct } from "./importerocct.js";
import { ImporterStl } from "./importerstl.js";
import { ImporterBim } from "./importerbim.js";
import { ImporterThreeFbx } from "./importerthree.js";
import { ImporterThreeDae } from "./importerthree.js";
import { ImporterThreeWrl } from "./importerthree.js";
import { ImporterThree3mf } from "./importerthree.js";
import { ImporterFcstd } from "./importerfcstd.js";
import { ImporterFileList } from "./importerfiles.js";
//# sourceMappingURL=importer.d.ts.map