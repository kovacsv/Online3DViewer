OV.ExporterGltf = class extends OV.ExporterBase
{
	constructor ()
	{
		super ();
        this.components = {
            index : {
                type : 5125, // unsigned int 32
                size : 4
            },
            number : {
                type : 5126, // float 32
                size : 4
            }
        };
	}

    CanExport (format, extension)
    {
        return (format === OV.FileFormat.Text && extension === 'gltf') || (format === OV.FileFormat.Binary && extension === 'glb');
    }
    
	ExportContent (model, format, files, onFinish)
	{
        if (format === OV.FileFormat.Text) {
            this.ExportAsciiContent (model, files);
        } else if (format === OV.FileFormat.Binary) {
            this.ExportBinaryContent (model, files);
        }
        onFinish ();
	}

	ExportAsciiContent (model, files)
	{
        let gltfFile = new OV.ExportedFile ('model.gltf');
        let binFile = new OV.ExportedFile ('model.bin');
        files.push (gltfFile);
        files.push (binFile);

        let meshDataArr = this.GetMeshData (model);
        let mainBuffer = this.GetMainBuffer (meshDataArr);
        let mainJson = this.GetMainJson (meshDataArr);
        mainJson.buffers.push ({
            uri : binFile.GetName (),
            byteLength : mainBuffer.byteLength
        });

        let fileNameToIndex = [];
        this.ExportMaterials (model, mainJson, (texture) => {
            let fileName = OV.GetFileName (texture.name);
            let textureIndex = fileNameToIndex[fileName];
            if (textureIndex === undefined) {
                let textureFile = new OV.ExportedFile (fileName);
                textureFile.SetContent (texture.buffer);
                files.push (textureFile);

                textureIndex = mainJson.textures.length;
                fileNameToIndex[fileName] = textureIndex;
                
                mainJson.images.push ({
                    uri : fileName
                });
                mainJson.textures.push ({
                    source : textureIndex
                });
            }
            return textureIndex;
        });

        gltfFile.SetContent (JSON.stringify (mainJson, null, 4));
        binFile.SetContent (mainBuffer);        
    }

    ExportBinaryContent (model, files)
    {
        function AlignToBoundary (size)
        {
            let remainder = size % 4;
            if (remainder === 0) {
                return size;
            }
            return size + (4 - remainder);
        }

        function WriteCharacters (writer, char, count)
        {
            for (let i = 0; i < count; i++) {
                writer.WriteUnsignedCharacter8 (char);
            }
        }
        
        let glbFile = new OV.ExportedFile ('model.glb');
        files.push (glbFile);

        let meshDataArr = this.GetMeshData (model);
        let mainBuffer = this.GetMainBuffer (meshDataArr);
        let mainJson = this.GetMainJson (meshDataArr);

        let textureBuffers = [];
        let textureOffset = mainBuffer.byteLength;

        let fileNameToIndex = [];
        this.ExportMaterials (model, mainJson, (texture) => {
            let fileName = OV.GetFileName (texture.name);
            let extension = OV.GetFileExtension (texture.name);
            let textureIndex = fileNameToIndex[fileName];
            if (textureIndex === undefined) {
                let bufferViewIndex = mainJson.bufferViews.length;
                textureIndex = mainJson.textures.length;
                fileNameToIndex[fileName] = textureIndex;
                let textureBuffer = texture.buffer;
                textureBuffers.push (textureBuffer);
                mainJson.bufferViews.push ({
                    buffer : 0,
                    byteOffset : textureOffset,
                    byteLength : textureBuffer.byteLength
                });
                textureOffset += textureBuffer.byteLength;
                mainJson.images.push ({
                    bufferView : bufferViewIndex,
                    mimeType : 'image/' + extension
                });
                mainJson.textures.push ({
                    source : textureIndex
                });
            }
            return textureIndex;
        });

        let mainBinaryBufferLength = mainBuffer.byteLength;
        for (let i = 0; i < textureBuffers.length; i++) {
            let textureBuffer = textureBuffers[i];
            mainBinaryBufferLength += textureBuffer.byteLength;
        }
        let mainBinaryBufferAlignedLength = AlignToBoundary (mainBinaryBufferLength);
        mainJson.buffers.push ({
            byteLength : mainBinaryBufferAlignedLength
        });

        let mainJsonString = JSON.stringify (mainJson);
        let mainJsonBuffer = OV.Utf8StringToArrayBuffer (mainJsonString);
        let mainJsonBufferLength = mainJsonBuffer.byteLength;
        let mainJsonBufferAlignedLength = AlignToBoundary (mainJsonBufferLength);

        let glbSize = 12 + 8 + mainJsonBufferAlignedLength + 8 + mainBinaryBufferAlignedLength;
        let glbWriter = new OV.BinaryWriter (glbSize, true);
        
        glbWriter.WriteUnsignedInteger32 (0x46546C67);
        glbWriter.WriteUnsignedInteger32 (2);
        glbWriter.WriteUnsignedInteger32 (glbSize);

        glbWriter.WriteUnsignedInteger32 (mainJsonBufferAlignedLength);
        glbWriter.WriteUnsignedInteger32 (0x4E4F534A);
        glbWriter.WriteArrayBuffer (mainJsonBuffer);
        WriteCharacters (glbWriter, 32, mainJsonBufferAlignedLength - mainJsonBufferLength);

        glbWriter.WriteUnsignedInteger32 (mainBinaryBufferAlignedLength);
        glbWriter.WriteUnsignedInteger32 (0x004E4942);
        glbWriter.WriteArrayBuffer (mainBuffer);

        for (let i = 0; i < textureBuffers.length; i++) {
            let textureBuffer = textureBuffers[i];
            glbWriter.WriteArrayBuffer (textureBuffer);
        }
        WriteCharacters (glbWriter, 0, mainBinaryBufferAlignedLength - mainBinaryBufferLength);

        glbFile.SetContent (glbWriter.GetBuffer ());
    }

    GetMeshData (model)
    {
        let meshDataArr = [];

        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            let buffer = OV.ConvertMeshToMeshBuffer (mesh);
            meshDataArr.push ({
                name : mesh.GetName (),
                buffer : buffer,
                offsets : [],
                sizes : []
            });
        }

        return meshDataArr;
    }

    GetMainBuffer (meshDataArr)
    {
        let mainBufferSize = 0;
        for (let meshIndex = 0; meshIndex < meshDataArr.length; meshIndex++) {
            let meshData = meshDataArr[meshIndex];
            mainBufferSize += meshData.buffer.GetByteLength (this.components.index.size, this.components.number.size);
        }

        let writer = new OV.BinaryWriter (mainBufferSize, true);
        for (let meshIndex = 0; meshIndex < meshDataArr.length; meshIndex++) {
            let meshData = meshDataArr[meshIndex];
            for (let primitiveIndex = 0; primitiveIndex < meshData.buffer.PrimitiveCount (); primitiveIndex++) {
                let primitive = meshData.buffer.GetPrimitive (primitiveIndex);
                let offset = writer.GetPosition ();
                for (let i = 0; i < primitive.indices.length; i++) {
                    writer.WriteUnsignedInteger32 (primitive.indices[i]);
                }
                for (let i = 0; i < primitive.vertices.length; i++) {
                    writer.WriteFloat32 (primitive.vertices[i]);
                }
                for (let i = 0; i < primitive.normals.length; i++) {
                    writer.WriteFloat32 (primitive.normals[i]);
                }
                for (let i = 0; i < primitive.uvs.length; i++) {
                    let texCoord = primitive.uvs[i];
                    if (i % 2 === 1) {
                        texCoord *= -1.0;
                    }
                    writer.WriteFloat32 (texCoord);
                }
                meshData.offsets.push (offset);
                meshData.sizes.push (writer.GetPosition () - offset);
            }
        }

        return writer.GetBuffer ();
    }

    GetMainJson (meshDataArr)
    {
        class BufferViewCreator
        {
            constructor (mainJson, byteOffset)
            {
                this.mainJson = mainJson;
                this.byteOffset = byteOffset;
            }

            AddBufferView (byteLength)
            {
                this.mainJson.bufferViews.push ({
                    buffer : 0,
                    byteOffset : this.byteOffset,
                    byteLength : byteLength,
                });
                this.byteOffset += byteLength;
            }
        }

        let mainJson = {
            asset : {
                version : '2.0',
                generator : 'https://3dviewer.net'
            },
            scene : 0,
            scenes : [
                {
                    nodes : []
                }
            ],
            nodes : [],
            materials : [],
            meshes : [],
            buffers : [],
            bufferViews : [],
            accessors : []
        };

        for (let meshIndex = 0; meshIndex < meshDataArr.length; meshIndex++) {
            let meshData = meshDataArr[meshIndex];
            mainJson.scenes[0].nodes.push (meshIndex);
            mainJson.nodes.push ({
                mesh : meshIndex
            });
            let jsonMesh = {
                name : this.GetExportedMeshName (meshData.name),
                primitives : []
            };

            let primitives = meshData.buffer.primitives;
            for (let primitiveIndex = 0; primitiveIndex < primitives.length; primitiveIndex++) {
                let primitive = primitives[primitiveIndex];

                let bufferViewIndex = mainJson.bufferViews.length;
                let bufferViewCreator = new BufferViewCreator (mainJson, meshData.offsets[primitiveIndex]);
                bufferViewCreator.AddBufferView (primitive.indices.length * this.components.index.size);
                bufferViewCreator.AddBufferView (primitive.vertices.length * this.components.number.size);
                bufferViewCreator.AddBufferView (primitive.normals.length * this.components.number.size);

                let accessorIndex = mainJson.accessors.length;
                let jsonPrimitive = {
                    attributes : {
                        POSITION : accessorIndex + 1,
                        NORMAL : accessorIndex + 2
                    },
                    indices : accessorIndex,
                    mode : 4,
                    material : primitive.material
                };
                
                let bounds = primitive.GetBounds ();
                mainJson.accessors.push ({
                    bufferView : bufferViewIndex,
                    byteOffset : 0,
                    componentType : this.components.index.type,
                    count : primitive.indices.length,
                    type : 'SCALAR'
                });
                mainJson.accessors.push ({
                    bufferView : bufferViewIndex + 1,
                    byteOffset : 0,
                    componentType : this.components.number.type,
                    count : primitive.vertices.length / 3,
                    min : bounds.min,
                    max : bounds.max,
                    type : 'VEC3'
                });
                mainJson.accessors.push ({
                    bufferView : bufferViewIndex + 2,
                    byteOffset : 0,
                    componentType : this.components.number.type,
                    count : primitive.normals.length / 3,
                    type : 'VEC3'
                });
                if (primitive.uvs.length > 0) {
                    bufferViewCreator.AddBufferView (primitive.uvs.length * this.components.number.size);
                    mainJson.accessors.push ({
                        bufferView : bufferViewIndex + 3,
                        byteOffset : 0,
                        componentType : this.components.number.type,
                        count : primitive.uvs.length / 2,
                        type : 'VEC2'
                    });
                    jsonPrimitive.attributes.TEXCOORD_0 = accessorIndex + 3;
                }

                jsonMesh.primitives.push (jsonPrimitive);
            }
            mainJson.meshes.push (jsonMesh);
        }

        return mainJson;
    }

    ExportMaterials (model, mainJson, addTexture)
    {
        function ExportMaterial (obj, mainJson, material, addTexture)
        {
            function ColorToRGBA (color, opacity)
            {
                return [
                    OV.SRGBToLinear (color.r / 255.0),
                    OV.SRGBToLinear (color.g / 255.0),
                    OV.SRGBToLinear (color.b / 255.0),
                    opacity
                ];
            }

            function ColorToRGB (color)
            {
                return [
                    OV.SRGBToLinear (color.r / 255.0),
                    OV.SRGBToLinear (color.g / 255.0),
                    OV.SRGBToLinear (color.b / 255.0)
                ];
            }

            function GetTextureParams (mainJson, texture, addTexture)
            {
                if (texture === null || !texture.IsValid ()) {
                    return null;
                }

                if (mainJson.images === undefined) {
                    mainJson.images = [];
                }
                if (mainJson.textures === undefined) {
                    mainJson.textures = [];
                }

                let textureIndex = addTexture (texture);
                   let textureParams = {
                    index : textureIndex
                };

                if (texture.HasTransformation ()) {
                    let extensionName = 'KHR_texture_transform';
                    if (mainJson.extensionsUsed === undefined) {
                        mainJson.extensionsUsed = [];
                    }
                    if (mainJson.extensionsUsed.indexOf (extensionName) === -1) {
                        mainJson.extensionsUsed.push (extensionName);
                    }
                    textureParams.extensions = {
                        KHR_texture_transform : {
                            offset : [texture.offset.x, -texture.offset.y],
                            scale : [texture.scale.x, texture.scale.y],
                            rotation : -texture.rotation
                        }
                    };
                }

                return textureParams;
            }

            let jsonMaterial = {
                name : obj.GetExportedMaterialName (material.name),
                pbrMetallicRoughness : {
                    baseColorFactor : ColorToRGBA (material.color, material.opacity)
                },
                emissiveFactor : ColorToRGB (material.emissive),
                doubleSided : true,
                alphaMode : 'OPAQUE'
            };

            if (material.transparent) {
                // TODO: mask, alphaCutoff?
                jsonMaterial.alphaMode = 'BLEND';
            }

            let baseColorTexture = GetTextureParams (mainJson, material.diffuseMap, addTexture);
            if (baseColorTexture !== null) {
                if (!material.multiplyDiffuseMap) {
                    jsonMaterial.pbrMetallicRoughness.baseColorFactor = ColorToRGBA (new OV.Color (255, 255, 255), material.opacity);
                }
                jsonMaterial.pbrMetallicRoughness.baseColorTexture = baseColorTexture;
            }
            let metallicTexture = GetTextureParams (mainJson, material.metalnessMap, addTexture);
            if (metallicTexture !== null) {
                jsonMaterial.pbrMetallicRoughness.metallicRoughnessTexture = metallicTexture; 
            } else {
                jsonMaterial.pbrMetallicRoughness.metallicFactor = material.metalness;
                jsonMaterial.pbrMetallicRoughness.roughnessFactor = material.roughness;
            }
            let normalTexture = GetTextureParams (mainJson, material.normalMap, addTexture);
            if (normalTexture !== null) {
                jsonMaterial.normalTexture = normalTexture; 
            }
            let emissiveTexture = GetTextureParams (mainJson, material.emissiveMap, addTexture);
            if (emissiveTexture !== null) {
                jsonMaterial.emissiveTexture = emissiveTexture; 
            }

            mainJson.materials.push (jsonMaterial);
        }

        for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
            let material = model.GetMaterial (materialIndex);
            ExportMaterial (this, mainJson, material, addTexture);
        }
    }
};
