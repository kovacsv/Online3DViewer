export function GetFileName(filePath: any): string;
export function GetFileExtension(filePath: any): string;
export function RequestUrl(url: any, onProgress: any): Promise<any>;
export function ReadFile(file: any, onProgress: any): Promise<any>;
export function TransformFileHostUrls(urls: any): void;
export function IsUrl(str: any): boolean;
/**
 * File source identifier for import.
 */
export type FileSource = any;
export namespace FileSource {
    const Url: number;
    const File: number;
    const Decompressed: number;
}
export namespace FileFormat {
    const Text: number;
    const Binary: number;
}
//# sourceMappingURL=fileutils.d.ts.map