export class BinaryWriter
{
    constructor (byteLength, isLittleEndian)
    {
        this.arrayBuffer = new ArrayBuffer (byteLength);
        this.dataView = new DataView (this.arrayBuffer);
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

    End ()
    {
        return this.position >= this.arrayBuffer.byteLength;
    }

    GetBuffer ()
    {
        return this.arrayBuffer;
    }

    WriteArrayBuffer (arrayBuffer)
    {
        let bufferView = new Uint8Array (arrayBuffer);
        let thisBufferView = new Uint8Array (this.arrayBuffer);
        thisBufferView.set (bufferView, this.position);
        this.position += arrayBuffer.byteLength;
    }

    WriteBoolean8 (val)
    {
        this.dataView.setInt8 (this.position, val ? 1 : 0);
        this.position = this.position + 1;
    }

    WriteCharacter8 (val)
    {
        this.dataView.setInt8 (this.position, val);
        this.position = this.position + 1;
    }

    WriteUnsignedCharacter8 (val)
    {
        this.dataView.setUint8 (this.position, val);
        this.position = this.position + 1;
    }

    WriteInteger16 (val)
    {
        this.dataView.setInt16 (this.position, val, this.isLittleEndian);
        this.position = this.position + 2;
    }

    WriteUnsignedInteger16 (val)
    {
        this.dataView.setUint16 (this.position, val, this.isLittleEndian);
        this.position = this.position + 2;
    }

    WriteInteger32 (val)
    {
        this.dataView.setInt32 (this.position, val, this.isLittleEndian);
        this.position = this.position + 4;
    }

    WriteUnsignedInteger32 (val)
    {
        this.dataView.setUint32 (this.position, val, this.isLittleEndian);
        this.position = this.position + 4;
    }

    WriteFloat32 (val)
    {
        this.dataView.setFloat32 (this.position, val, this.isLittleEndian);
        this.position = this.position + 4;
    }

    WriteDouble64 (val)
    {
        this.dataView.setFloat64 (this.position, val, this.isLittleEndian);
        this.position = this.position + 8;
    }
}
