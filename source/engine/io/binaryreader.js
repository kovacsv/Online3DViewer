export class BinaryReader
{
    constructor (arrayBuffer, isLittleEndian)
    {
        this.arrayBuffer = arrayBuffer;
        this.dataView = new DataView (arrayBuffer);
        this.isLittleEndian = isLittleEndian;
        this.position = 0;
    }

    GetPosition ()
    {
        return this.position;
    }

    SetPosition (position)
    {
        this.position = position;
    }

    GetByteLength ()
    {
        return this.arrayBuffer.byteLength;
    }

    Skip (bytes)
    {
        this.position = this.position + bytes;
    }

    End ()
    {
        return this.position >= this.arrayBuffer.byteLength;
    }

    ReadArrayBuffer (byteLength)
    {
        let originalBufferView = new Uint8Array (this.arrayBuffer);
        let arrayBuffer = new ArrayBuffer (byteLength);
        let bufferView = new Uint8Array (arrayBuffer);
        let subArray = originalBufferView.subarray (this.position, this.position + byteLength);
        bufferView.set (subArray, 0);
        this.position += byteLength;
        return arrayBuffer;
    }

    ReadBoolean8 ()
    {
        let result = this.dataView.getInt8 (this.position);
        this.position = this.position + 1;
        return result ? true : false;
    }

    ReadCharacter8 ()
    {
        let result = this.dataView.getInt8 (this.position);
        this.position = this.position + 1;
        return result;
    }

    ReadUnsignedCharacter8 ()
    {
        let result = this.dataView.getUint8 (this.position);
        this.position = this.position + 1;
        return result;
    }

    ReadInteger16 ()
    {
        let result = this.dataView.getInt16 (this.position, this.isLittleEndian);
        this.position = this.position + 2;
        return result;
    }

    ReadUnsignedInteger16 ()
    {
        let result = this.dataView.getUint16 (this.position, this.isLittleEndian);
        this.position = this.position + 2;
        return result;
    }

    ReadInteger32 ()
    {
        let result = this.dataView.getInt32 (this.position, this.isLittleEndian);
        this.position = this.position + 4;
        return result;
    }

    ReadUnsignedInteger32 ()
    {
        let result = this.dataView.getUint32 (this.position, this.isLittleEndian);
        this.position = this.position + 4;
        return result;
    }

    ReadFloat32 ()
    {
        let result = this.dataView.getFloat32 (this.position, this.isLittleEndian);
        this.position = this.position + 4;
        return result;
    }

    ReadDouble64 ()
    {
        let result = this.dataView.getFloat64 (this.position, this.isLittleEndian);
        this.position = this.position + 8;
        return result;
    }
}
