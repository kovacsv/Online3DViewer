OV.PlyHeader = class
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
            return false;
        }
        
        let face = this.GetElement ('face');
        if (this.format === 'ascii') {
            if (face === null || face.count === 0 || face.format.length < 0) {
                return false;
            }
        } else if (this.format === 'binary_little_endian' || this.format === 'binary_big_endian') {
            let triStrips = this.GetElement ('tristrips');
            let hasFaces = (face !== null && face.count > 0 && face.format.length > 0);
            let hasTriStrips = (triStrips !== null && triStrips.count > 0 && triStrips.format.length > 0);
            if (!hasFaces && !hasTriStrips) {
                return false;
            }
        } else {
            return false;
        }

        return true;
    }
};

OV.ImporterPly = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }
    
    CanImportExtension (extension)
    {
        return extension === 'ply';
    }
    
    GetKnownFileFormats ()
    {
        return {
            'ply' : OV.FileFormat.Binary
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
    
    ClearContent ()
    {
        this.mesh = null;
    }

    ResetContent ()
    {
        this.mesh = new OV.Mesh ();
        this.model.AddMesh (this.mesh);
    }

    ImportContent (fileContent, onFinish)
    {
        let headerString = this.GetHeaderContent (fileContent);
        let header = this.ReadHeader (headerString);
        if (header.Check ()) {
            if (header.format === 'ascii') {
                let contentString = OV.ArrayBufferToUtf8String (fileContent);
                contentString = contentString.substr (headerString.length);
                this.ReadAsciiContent (header, contentString);
            } else if (header.format === 'binary_little_endian' || header.format === 'binary_big_endian') {
                this.ReadBinaryContent (header, fileContent, headerString.length);
            }
        } else {
            this.SetError ();
            this.SetMessage ('Invalid header information.');
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
        let header = new OV.PlyHeader ();
        OV.ReadLines (headerContent, function (line) {
            let parameters = OV.ParametersFromLine (line, null);
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
        let obj = this;
        let vertex = header.GetElement ('vertex');
        let face = header.GetElement ('face');
        let foundVertex = 0;
        let foundFace = 0;
        OV.ReadLines (fileContent, function (line) {
            if (obj.IsError ()) {
                return;
            }
            
            let parameters = OV.ParametersFromLine (line, null);
            if (parameters.length === 0 || parameters[0] === 'comment') {
                return;
            }
    
            if (foundVertex < vertex.count) {
                if (parameters.length >= 3) {
                    obj.mesh.AddVertex (new OV.Coord3D (
                        parseFloat (parameters[0]),
                        parseFloat (parameters[1]),
                        parseFloat (parameters[2])
                    ));
                    foundVertex += 1;
                }
                return;
            }
    
            if (foundFace < face.count) {
                if (parameters.length >= 4) {
                    let vertexCount = parseInt (parameters[0], 10);
                    if (parameters.length < vertexCount + 1) {
                        return;
                    }
                    for (let i = 0; i < vertexCount - 2; i++) {
                        let v0 = parseInt (parameters[1]);
                        let v1 = parseInt (parameters[i + 2]);
                        let v2 = parseInt (parameters[i + 3]);
                        let triangle = new OV.Triangle (v0, v1, v2);
                        obj.mesh.AddTriangle (triangle);
                    }
                    foundFace += 1;
                }
                return;
            }
        });
    }

    ReadBinaryContent (header, fileContent, headerLength)
    {
        function SkipAndGetColor (obj, reader, format, startIndex)
        {
            let r = null;
            let g = null;
            let b = null;
            let a = 255;

            for (let i = startIndex; i < format.length; i++) {
                let currFormat = format[i];
                let val = obj.ReadByFormat (reader, currFormat);
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

        function GetMaterialFromColor (obj, color, colorToMaterial)
        {
            function IntegerToHex (intVal)
            {
                let result = parseInt (intVal, 10).toString (16);
                while (result.length < 2) {
                    result = '0' + result;
                }
                return result;
            }

            if (color === null) {
                return null;
            }

            let materialName = 'Color ' + IntegerToHex (color[0]) + IntegerToHex (color[1]) + IntegerToHex (color[2]) + IntegerToHex (color[3]);
            let materialIndex = colorToMaterial[materialName];
            if (materialIndex === undefined) {
                let material = new OV.Material ();
                material.name = materialName;
                material.diffuse = new OV.Color (color[0], color[1], color[2]);
                material.opacity = color[3] / 255.0;
                OV.UpdateMaterialTransparency (material);
                materialIndex = obj.model.AddMaterial (material);
                colorToMaterial[materialName] = materialIndex;
            }

            return materialIndex;
        }

        function GetFaceColorByVertexColors (obj, v0, v1, v2, vertexColors, colorToMaterial)
        {
            let c0 = vertexColors[v0];
            let c1 = vertexColors[v1];
            let c2 = vertexColors[v2];
            let d0 = Math.abs (c0[0] - c1[0]) + Math.abs (c0[1] - c1[1]) + Math.abs (c0[2] - c1[2]);
            let d1 = Math.abs (c1[0] - c2[0]) + Math.abs (c1[1] - c2[1]) + Math.abs (c1[2] - c2[2]);
            let d2 = Math.abs (c0[0] - c2[0]) + Math.abs (c0[1] - c2[1]) + Math.abs (c0[2] - c2[2]);
            let min = Math.min (d0, d1, d2);
            let color = c0;
            if (min === d1) {
                color = c1;
            }
            return GetMaterialFromColor (obj, color, colorToMaterial);
        }

        let reader = null;
        if (header.format === 'binary_little_endian') {
            reader = new OV.BinaryReader (fileContent, true);
        } else if (header.format === 'binary_big_endian') {
            reader = new OV.BinaryReader (fileContent, false);
        } else {
            return;
        }
        reader.Skip (headerLength);

        let vertexColors = [];
        let colorToMaterial = {};
        let elements = header.GetElements ();
        for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            let element = elements[elementIndex];
            if (element.name === 'vertex') {
                for (let vertexIndex = 0; vertexIndex < element.count; vertexIndex++) {
                    let x = this.ReadByFormat (reader, element.format[0]);
                    let y = this.ReadByFormat (reader, element.format[1]);
                    let z = this.ReadByFormat (reader, element.format[2]);
                    let color = SkipAndGetColor (this, reader, element.format, 3);
                    if (color !== null) {
                        vertexColors.push (color);
                    }
                    this.mesh.AddVertex (new OV.Coord3D (x, y, z));
                }
            } else if (element.name === 'face') {
                for (let faceIndex = 0; faceIndex < element.count; faceIndex++) {
                    let vertices = this.ReadByFormat (reader, element.format[0]);
                    let faceColor = SkipAndGetColor (this, reader, element.format, 1);
                    for (let i = 0; i < vertices.length - 2; i++) {
                        let v0 = vertices[0];
                        let v1 = vertices[i + 1];
                        let v2 = vertices[i + 2];
                        let triangle = new OV.Triangle (v0, v1, v2);
                        if (faceColor !== null) {
                            triangle.mat = GetMaterialFromColor (this, faceColor, colorToMaterial);
                        } else if (vertexColors.length === this.model.VertexCount ()) {
                            triangle.mat = GetFaceColorByVertexColors (this, v0, v1, v2, vertexColors, colorToMaterial);
                        }
                        this.mesh.AddTriangle (triangle);
                    }
                }
            } else if (element.name === 'tristrips') {
                for (let triStripIndex = 0; triStripIndex < element.count; triStripIndex++) {
                    let vertices = this.ReadByFormat (reader, element.format[0]);
                    this.SkipFormat (reader, element.format, 1);
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
                        let triangle = new OV.Triangle (v0, v1, v2);
                        this.mesh.AddTriangle (triangle);
                    }
                }              
            } else {
                this.SkipFormat (reader, element.format, 0);
            }
        }
    }

    SkipFormat (reader, format, startIndex)
    {
        for (let i = startIndex; i < format.length; i++) {
            this.ReadByFormat (reader, format[i]);
        }
    }

    ReadByFormat (reader, format)
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
};
