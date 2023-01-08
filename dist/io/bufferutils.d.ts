export function ArrayBufferToUtf8String(buffer: any): string;
export function ArrayBufferToAsciiString(buffer: any): string;
export function AsciiStringToArrayBuffer(str: any): ArrayBuffer;
export function Utf8StringToArrayBuffer(str: any): ArrayBufferLike;
export function Base64DataURIToArrayBuffer(uri: any): {
    mimeType: any;
    buffer: ArrayBuffer;
};
export function GetFileExtensionFromMimeType(mimeType: any): any;
export function CreateObjectUrl(content: any): string;
export function CreateObjectUrlWithMimeType(content: any, mimeType: any): string;
export function RevokeObjectUrl(url: any): void;
//# sourceMappingURL=bufferutils.d.ts.map