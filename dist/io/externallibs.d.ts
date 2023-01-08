/**
 * Sets the location of the external libraries used by the engine. This is the content of the libs
 * folder in the package. The location must be relative to the main file.
 * @param {string} newExternalLibLocation Relative path to the libs folder.
 */
export function SetExternalLibLocation(newExternalLibLocation: string): void;
export function GetExternalLibPath(libName: any): string;
export function LoadExternalLibrary(libName: any): Promise<any>;
//# sourceMappingURL=externallibs.d.ts.map