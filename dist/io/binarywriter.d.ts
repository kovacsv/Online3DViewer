export class BinaryWriter {
    constructor(byteLength: any, isLittleEndian: any);
    arrayBuffer: ArrayBuffer;
    dataView: DataView;
    isLittleEndian: any;
    position: number;
    GetPosition(): number;
    SetPosition(position: any): void;
    End(): boolean;
    GetBuffer(): ArrayBuffer;
    WriteArrayBuffer(arrayBuffer: any): void;
    WriteBoolean8(val: any): void;
    WriteCharacter8(val: any): void;
    WriteUnsignedCharacter8(val: any): void;
    WriteInteger16(val: any): void;
    WriteUnsignedInteger16(val: any): void;
    WriteInteger32(val: any): void;
    WriteUnsignedInteger32(val: any): void;
    WriteFloat32(val: any): void;
    WriteDouble64(val: any): void;
}
//# sourceMappingURL=binarywriter.d.ts.map