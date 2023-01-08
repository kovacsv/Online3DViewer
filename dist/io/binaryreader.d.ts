export class BinaryReader {
    constructor(arrayBuffer: any, isLittleEndian: any);
    arrayBuffer: any;
    dataView: DataView;
    isLittleEndian: any;
    position: number;
    GetPosition(): number;
    SetPosition(position: any): void;
    GetByteLength(): any;
    Skip(bytes: any): void;
    End(): boolean;
    ReadArrayBuffer(byteLength: any): ArrayBuffer;
    ReadBoolean8(): boolean;
    ReadCharacter8(): number;
    ReadUnsignedCharacter8(): number;
    ReadInteger16(): number;
    ReadUnsignedInteger16(): number;
    ReadInteger32(): number;
    ReadUnsignedInteger32(): number;
    ReadFloat32(): number;
    ReadDouble64(): number;
}
//# sourceMappingURL=binaryreader.d.ts.map