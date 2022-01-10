import { Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { BinaryReader } from '../io/binaryreader.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { Color, IntegerToHexString } from '../model/color.js';
import { PhongMaterial } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { ParametersFromLine, ReadLines, UpdateMaterialTransparency } from './importerutils.js';

export const PlyHeaderCheckResult =
{
    Ok : 1,
    NoVertices : 2,
    NoFaces : 3,
    UnknownError : 4
};

export class PlyHeader
{
    constructor ()
    {
        this.format = null;
        this.elements = [];
    }

    SetFormat (format)
    {
        this.format = format;
    }

    AddElement (name, count)
    {
        this.elements.push ({
            name : name,
            count : count,
            format : []
        });
    }

    GetElements ()
    {
        return this.elements;
    }

    AddSingleFormat (elemType, name)
    {
        let lastElement = this.elements[this.elements.length - 1];
        lastElement.format.push ({
            name : name,
            isSingle : true,
            elemType : elemType
        });
    }

    AddListFormat (countType, elemType, name)
    {
        let lastElement = this.elements[this.elements.length - 1];
        lastElement.format.push ({
            name : name,
            isSingle : false,
            countType : countType,
            elemType : elemType
        });
    }

    GetElement (name)
    {
        for (let i = 0; i < this.elements.length; i++) {
            let element = this.elements[i];
            if (element.name === name) {
                return element;
            }
        }
        return null;
    }

    Check ()
    {
        let vertex = this.GetElement ('vertex');
        if (vertex === null || vertex.length === 0 || vertex.format.length < 3) {
            return PlyHeaderCheckResult.NoVertices;
        }

        let face = this.GetElement ('face');
        if (this.format === 'ascii') {
            if (face === null || face.count === 0 || face.format.length < 0) {
                return PlyHeaderCheckResult.NoFaces;
            }
        } else if (this.format === 'binary_little_endian' || this.format === 'binary_big_endian') {
            let triStrips = this.GetElement ('tristrips');
            let hasFaces = (face !== null && face.count > 0 && face.format.length > 0);
            let hasTriStrips = (triStrips !== null && triStrips.count > 0 && triStrips.format.length > 0);
            if (!hasFaces && !hasTriStrips) {
                return PlyHeaderCheckResult.NoFaces;
            }
        } else {
            return PlyHeaderCheckResult.UnknownError;
        }

        return PlyHeaderCheckResult.Ok;
    }
}

export class PlyMaterialHandler
{
    constructor (model)
    {
        this.model = model;
        this.colorToMaterial = new Map ();
    }

    GetMaterialIndexByColor (color)
    {
        let materialName = 'Color ' +
            IntegerToHexString (color[0]) +
            IntegerToHexString (color[1]) +
            IntegerToHexString (color[2]) +
            IntegerToHexString (color[3]);

        if (this.colorToMaterial.has (materialName)) {
            return this.colorToMaterial.get (materialName);
        } else {
            let material = new PhongMaterial ();
            material.name = materialName;
            material.color = new Color (color[0], color[1], color[2]);
            material.opacity = color[3] / 255.0;
            UpdateMaterialTransparency (material);
            let materialIndex = this.model.AddMaterial (material);
            this.colorToMaterial.set (materialName, materialIndex);
            return materialIndex;
        }
    }
}

export class ImporterPly extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'ply';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    ClearContent ()
    {
        this.mesh = null;
    }

    ResetContent ()
    {
        this.mesh = new Mesh ();
        this.model.AddMeshToRootNode (this.mesh);
    }

    ImportContent (fileContent, onFinish)
    {
        let headerString = this.GetHeaderContent (fileContent);
        let header = this.ReadHeader (headerString);
        let checkResult = header.Check ();
        if (checkResult === PlyHeaderCheckResult.Ok) {
            if (header.format === 'ascii') {
                let contentString = ArrayBufferToUtf8String (fileContent);
                contentString = contentString.substr (headerString.length);
                this.ReadAsciiContent (header, contentString);
            } else if (header.format === 'binary_little_endian' || header.format === 'binary_big_endian') {
                this.ReadBinaryContent (header, fileContent, headerString.length);
            }
        } else {
            if (checkResult === PlyHeaderCheckResult.NoVertices) {
                this.SetError ('The model contains no vertices.');
            } else if (checkResult === PlyHeaderCheckResult.NoFaces) {
                this.SetError ('The model contains no faces.');
            } else {
                this.SetError ('Invalid header information.');
            }
        }
        onFinish ();
    }

    GetHeaderContent (fileContent)
    {
        let headerContent = '';
        let bufferView = new Uint8Array (fileContent);
        let bufferIndex = 0;
        for (bufferIndex = 0; bufferIndex < fileContent.byteLength; bufferIndex++) {
            headerContent += String.fromCharCode (bufferView[bufferIndex]);
            if (headerContent.endsWith ('end_header')) {
                break;
            }
        }
        bufferIndex += 1;
        while (bufferIndex < fileContent.byteLength) {
            let char = String.fromCharCode (bufferView[bufferIndex]);
            headerContent += char;
            bufferIndex += 1;
            if (char === '\n') {
                break;
            }
        }
        return headerContent;
    }

    ReadHeader (headerContent)
    {
        let header = new PlyHeader ();
        ReadLines (headerContent, (line) => {
            let parameters = ParametersFromLine (line, null);
            if (parameters.length === 0 || parameters[0] === 'comment') {
                return;
            }

            if (parameters[0] === 'ply') {
                return;
            } else if (parameters[0] === 'format' && parameters.length >= 2) {
                header.SetFormat (parameters[1]);
            } else if (parameters[0] === 'element' && parameters.length >= 3) {
                header.AddElement (parameters[1], parseInt (parameters[2], 10));
            } else if (parameters[0] === 'property' && parameters.length >= 3) {
                if (parameters[1] === 'list' && parameters.length >= 5) {
                    header.AddListFormat (parameters[2], parameters[3], parameters[4]);
                } else {
                    header.AddSingleFormat (parameters[1], parameters[2]);
                }
            }
        });

        return header;
    }

    ReadAsciiContent (header, fileContent)
    {
        let vertex = header.GetElement ('vertex');
        let face = header.GetElement ('face');
        let foundVertex = 0;
        let foundFace = 0;
        ReadLines (fileContent, (line) => {
            if (this.WasError ()) {
                return;
            }

            let parameters = ParametersFromLine (line, null);
            if (parameters.length === 0 || parameters[0] === 'comment') {
                return;
            }

            if (foundVertex < vertex.count) {
                if (parameters.length >= 3) {
                    this.mesh.AddVertex (new Coord3D (
                        parseFloat (parameters[0]),
                        parseFloat (parameters[1]),
                        parseFloat (parameters[2])
                    ));
                    foundVertex += 1;
                }
                return;
            }

            if (face !== null && foundFace < face.count) {
                if (parameters.length >= 4) {
                    let vertexCount = parseInt (parameters[0], 10);
                    if (parameters.length < vertexCount + 1) {
                        return;
                    }
                    for (let i = 0; i < vertexCount - 2; i++) {
                        let v0 = parseInt (parameters[1]);
                        let v1 = parseInt (parameters[i + 2]);
                        let v2 = parseInt (parameters[i + 3]);
                        let triangle = new Triangle (v0, v1, v2);
                        this.mesh.AddTriangle (triangle);
                    }
                    foundFace += 1;
                }
                return;
            }
        });
    }

    ReadBinaryContent (header, fileContent, headerLength)
    {
        function ReadByFormat (reader, format)
        {
            function ReadType (reader, type)
            {
                if (type === 'char' || type === 'int8') {
                    return reader.ReadCharacter8 ();
                } else if (type === 'uchar' || type === 'uint8') {
                    return reader.ReadUnsignedCharacter8 ();
                } else if (type === 'short' || type === 'int16') {
                    return reader.ReadInteger16 ();
                } else if (type === 'ushort' || type === 'uint16') {
                    return reader.ReadUnsignedInteger16 ();
                } else if (type === 'int' || type === 'int32') {
                    return reader.ReadInteger32 ();
                } else if (type === 'uint' || type === 'uint32') {
                    return reader.ReadUnsignedInteger32 ();
                } else if (type === 'float' || type === 'float32') {
                    return reader.ReadFloat32 ();
                } else if (type === 'double' || type === 'double64') {
                    return reader.ReadDouble64 ();
                }
                return null;
            }

            if (format.isSingle) {
                return ReadType (reader, format.elemType);
            } else {
                let list = [];
                let count = ReadType (reader, format.countType);
                for (let i = 0; i < count; i++) {
                    list.push (ReadType (reader, format.elemType));
                }
                return list;
            }
        }

        function SkipFormat (reader, format, startIndex)
        {
            for (let i = startIndex; i < format.length; i++) {
                ReadByFormat (reader, format[i]);
            }
        }

        function SkipAndGetColor (reader, format, startIndex)
        {
            let r = null;
            let g = null;
            let b = null;
            let a = 255;

            for (let i = startIndex; i < format.length; i++) {
                let currFormat = format[i];
                let val = ReadByFormat (reader, currFormat);
                if (currFormat.name === 'red') {
                    r = val;
                } else if (currFormat.name === 'green') {
                    g = val;
                } else if (currFormat.name === 'blue') {
                    b = val;
                } else if (currFormat.name === 'alpha') {
                    a = val;
                }
            }

            if (r !== null && g !== null && b !== null) {
                return [r, g, b, a];
            }

            return null;
        }

        let reader = null;
        if (header.format === 'binary_little_endian') {
            reader = new BinaryReader (fileContent, true);
        } else if (header.format === 'binary_big_endian') {
            reader = new BinaryReader (fileContent, false);
        } else {
            return;
        }
        reader.Skip (headerLength);

        let materialHandler = new PlyMaterialHandler (this.model);
        let elements = header.GetElements ();
        for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            let element = elements[elementIndex];
            if (element.name === 'vertex') {
                for (let vertexIndex = 0; vertexIndex < element.count; vertexIndex++) {
                    let x = ReadByFormat (reader, element.format[0]);
                    let y = ReadByFormat (reader, element.format[1]);
                    let z = ReadByFormat (reader, element.format[2]);
                    let color = SkipAndGetColor (reader, element.format, 3);
                    if (color !== null) {
                        this.mesh.AddVertexColor (new Color (color[0], color[1], color[2]));
                    }
                    this.mesh.AddVertex (new Coord3D (x, y, z));
                }
            } else if (element.name === 'face') {
                for (let faceIndex = 0; faceIndex < element.count; faceIndex++) {
                    let vertices = ReadByFormat (reader, element.format[0]);
                    let faceColor = SkipAndGetColor (reader, element.format, 1);
                    for (let i = 0; i < vertices.length - 2; i++) {
                        let v0 = vertices[0];
                        let v1 = vertices[i + 1];
                        let v2 = vertices[i + 2];
                        let triangle = new Triangle (v0, v1, v2);
                        if (faceColor !== null) {
                            triangle.mat = materialHandler.GetMaterialIndexByColor (faceColor);
                        } else if (this.mesh.VertexColorCount () > 0) {
                            triangle.SetVertexColors (v0, v1, v2);
                        }
                        this.mesh.AddTriangle (triangle);
                    }
                }
            } else if (element.name === 'tristrips') {
                for (let triStripIndex = 0; triStripIndex < element.count; triStripIndex++) {
                    let vertices = ReadByFormat (reader, element.format[0]);
                    SkipFormat (reader, element.format, 1);
                    let ccw = true;
                    for (let i = 0; i < vertices.length - 2; i++) {
                        let v0 = vertices[i];
                        let v1 = vertices[i + 1];
                        let v2 = vertices[i + 2];
                        if (v2 === -1) {
                            i += 2;
                            ccw = true;
                            continue;
                        }
                        if (!ccw) {
                            let tmp = v1;
                            v1 = v2;
                            v2 = tmp;
                        }
                        ccw = !ccw;
                        let triangle = new Triangle (v0, v1, v2);
                        this.mesh.AddTriangle (triangle);
                    }
                }
            } else {
                SkipFormat (reader, element.format, 0);
            }
        }
    }
}
