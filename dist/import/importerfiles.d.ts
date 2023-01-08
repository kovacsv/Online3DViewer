export function InputFilesFromUrls(urls: any): InputFile[];
export function InputFilesFromFileObjects(fileObjects: any): InputFile[];
/**
 * File representation class for importers.
 */
export class InputFile {
    /**
     * @param {string} name Name of the file.
     * @param {FileSource} source Source of the file.
     * @param {*} data If the file source is url, this must be the url string. If the file source
     * is file, this must be a {@link File} object.
     */
    constructor(name: string, source: any, data: any);
    name: string;
    source: any;
    data: any;
}
export class ImporterFile {
    constructor(name: any, source: any, data: any);
    name: string;
    extension: string;
    source: any;
    data: any;
    content: any;
    SetContent(content: any): void;
}
export class ImporterFileList {
    files: any[];
    FillFromInputFiles(inputFiles: any): void;
    ExtendFromFileList(fileList: any): void;
    GetFiles(): any[];
    GetContent(callbacks: any): void;
    ContainsFileByPath(filePath: any): boolean;
    FindFileByPath(filePath: any): any;
    IsOnlyUrlSource(): boolean;
    AddFile(file: any): void;
    GetFileContent(file: any, callbacks: any): void;
}
//# sourceMappingURL=importerfiles.d.ts.map