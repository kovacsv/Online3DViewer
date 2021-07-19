OV.GltfComponentType =
{
    BYTE : 5120,
    UNSIGNED_BYTE : 5121,
    SHORT : 5122,
    UNSIGNED_SHORT : 5123,
    UNSIGNED_INT : 5125,
    FLOAT  : 5126
};

OV.GltfDataType =
{
    SCALAR : 0,
    VEC2 : 1,
    VEC3 : 2,
    VEC4 : 3,
    MAT2 : 4,
    MAT3  : 5,
    MAT4  : 6
};

OV.GltfRenderMode =
{
    POINTS : 0,
    LINES : 1,
    LINE_LOOP : 2,
    LINE_STRIP : 3,
    TRIANGLES : 4,
    TRIANGLE_STRIP  : 5,
    TRIANGLE_FAN : 6
};

OV.GltfConstants =
{
    GLTF_STRING : 0x46546C67,
    JSON_CHUNK_TYPE : 0x4E4F534A,
    BINARY_CHUNK_TYPE : 0x004E4942
};

OV.GltfNodeTree = class
{
    constructor ()
    {
        this.nodes = [];
        this.nodeToParent = {};
        this.nodeMatrices = {};
    }

    AddMeshNode (nodeIndex)
    {
        this.nodes.push (nodeIndex);
        return this.nodes.length - 1;
    }

    AddNodeParent (nodeIndex, parentIndex)
    {
        this.nodeToParent[nodeIndex] = parentIndex;
    }

    GetNodeParent (nodeIndex)
    {
        let parentIndex = this.nodeToParent[nodeIndex];
        if (parentIndex === undefined || parentIndex === -1) {
            return null;
        }
        return parentIndex;
    }

    AddNodeMatrix (nodeIndex, matrix)
    {
        this.nodeMatrices[nodeIndex] = matrix;
    }

    GetNodeMatrix (nodeIndex)
    {
        let matrix = this.nodeMatrices[nodeIndex];
        if (matrix === undefined) {
            return null;
        }
        return matrix;
    }    
};

OV.GltfBufferReader = class
{
    constructor (buffer)
    {
        this.reader = new OV.BinaryReader (buffer, true);
        this.componentType = null;
        this.dataType = null;
        this.byteStride = null;
        this.dataCount = null;
        this.sparseReader = null;
    }

    SetComponentType (componentType)
    {
        this.componentType = componentType;
    }

    SetDataType (dataType)
    {
        if (dataType === 'SCALAR') {
            this.dataType = OV.GltfDataType.SCALAR;
        } else if (dataType === 'VEC2') {
            this.dataType = OV.GltfDataType.VEC2;
        } else if (dataType === 'VEC3') {
            this.dataType = OV.GltfDataType.VEC3;
        } else if (dataType === 'VEC4') {
            this.dataType = OV.GltfDataType.VEC4;
        } else if (dataType === 'MAT2') {
            this.dataType = OV.GltfDataType.MAT2;
        } else if (dataType === 'MAT3') {
            this.dataType = OV.GltfDataType.MAT3;
        } else if (dataType === 'MAT4') {
            this.dataType = OV.GltfDataType.MAT4;
        }
    }

    SetByteStride (byteStride)
    {
        this.byteStride = byteStride;
    }

    SetDataCount (dataCount)
    {
        this.dataCount = dataCount;
    }

    SetSparseReader (indexReader, valueReader)
    {
        this.sparseReader = {
            indexReader : indexReader,
            valueReader : valueReader
        };
    }

    ReadArrayBuffer (byteLength)
    {
        return this.reader.ReadArrayBuffer (byteLength);
    }
    
    GetDataCount ()
    {
        return this.dataCount;
    }

    ReadData ()
    {
        if (this.dataType === null) {
            return null;
        }
        if (this.dataType === OV.GltfDataType.SCALAR) {
            let data = this.ReadComponent ();
            this.SkipBytesByStride (1);
            return data;
        } else if (this.dataType === OV.GltfDataType.VEC2) {
            let x = this.ReadComponent ();
            let y = this.ReadComponent ();
            this.SkipBytesByStride (2);
            return new OV.Coord2D (x, y);
        } else if (this.dataType === OV.GltfDataType.VEC3) {
            let x = this.ReadComponent ();
            let y = this.ReadComponent ();
            let z = this.ReadComponent ();
            this.SkipBytesByStride (3);
            return new OV.Coord3D (x, y, z);
        }
        return null;
    }

    EnumerateData (onData)
    {
        if (this.sparseReader === null) {
            for (let i = 0; i < this.dataCount; i++) {
                onData (this.ReadData ());
            }
        } else {
            let sparseData = [];
            for (let i = 0; i < this.sparseReader.indexReader.GetDataCount (); i++) {
                let index = this.sparseReader.indexReader.ReadData ();
                let value = this.sparseReader.valueReader.ReadData ();
                sparseData.push ({
                    index : index,
                    value : value
                });
            }
            let sparseIndex = 0;
            for (let i = 0; i < this.dataCount; i++) {
                let data = this.ReadData ();
                if (sparseIndex < sparseData.length && sparseData[sparseIndex].index === i) {
                    onData (sparseData[sparseIndex].value);
                    sparseIndex += 1;
                } else {
                    onData (data);
                }
            }
        }
    }

    SkipBytes (bytes)
    {
        this.reader.Skip (bytes);
    }

    ReadComponent ()
    {
        if (this.componentType === null) {
            return null;
        }
        if (this.componentType === OV.GltfComponentType.BYTE) {
            return this.reader.ReadCharacter8 ();
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_BYTE) {
            return this.reader.ReadUnsignedCharacter8 ();
        } else if (this.componentType === OV.GltfComponentType.SHORT) {
            return this.reader.ReadInteger16 ();
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_SHORT) {
            return this.reader.ReadUnsignedInteger16 ();
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_INT) {
            return this.reader.ReadInteger32 ();
        } else if (this.componentType === OV.GltfComponentType.FLOAT) {
            return this.reader.ReadFloat32 ();
        }
        return null;
    }

    SkipBytesByStride (componentCount)
    {
        if (this.byteStride === null) {
            return;
        }
        let readBytes = componentCount * this.GetComponentSize ();
        this.reader.Skip (this.byteStride - readBytes);
    }

    GetComponentSize ()
    {
        if (this.componentType === OV.GltfComponentType.BYTE) {
            return 1;
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_BYTE) {
            return 1;
        } else if (this.componentType === OV.GltfComponentType.SHORT) {
            return 2;
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_SHORT) {
            return 2;
        } else if (this.componentType === OV.GltfComponentType.UNSIGNED_INT) {
            return 4;
        } else if (this.componentType === OV.GltfComponentType.FLOAT) {
            return 4;
        }
        return 0;
    }    
};

OV.GltfExtensions = class
{
    constructor ()
    {
        this.supportedExtensions = [
            'KHR_draco_mesh_compression',
            'KHR_materials_pbrSpecularGlossiness',
            'KHR_texture_transform',
        ];
        this.draco = null;
    }

    LoadLibraries (extensionsRequired, callbacks)
    {
        if (extensionsRequired === undefined) {
            callbacks.onSuccess ();
            return;
        }        
        if (this.draco === null && extensionsRequired.indexOf ('KHR_draco_mesh_compression') !== -1) {
			OV.LoadExternalLibrary ('draco_decoder.js', {
				success : () => {
					DracoDecoderModule ().then ((draco) => {
						this.draco = draco;
						callbacks.onSuccess ();
					});
				},
				error : () => {
					callbacks.onError ();
				}
			});
        } else {
            callbacks.onSuccess ();
        }
    }

    GetUnsupportedExtensions (extensionsRequired)
    {
        let unsupportedExtensions = [];
        if (extensionsRequired === undefined) {
            return unsupportedExtensions;
        }
        for (let i = 0; i < extensionsRequired.length; i++) {
            let requiredExtension = extensionsRequired[i];
            if (this.supportedExtensions.indexOf (requiredExtension) === -1) {
                unsupportedExtensions.push (requiredExtension);
            }
        }
        return unsupportedExtensions;
    }

    ProcessMaterial (gltfMaterial, material, imporTextureFn)
    {
        function GetMaterialComponent (component)
        {
            return parseInt (Math.round (OV.LinearToSRGB (component) * 255.0), 10);
        }

        if (gltfMaterial.extensions === undefined) {
            return;
        }
        let khrSpecularGlossiness = gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness;
        if (khrSpecularGlossiness !== undefined) {
            material.type = OV.MaterialType.Phong;
            let diffuseColor = khrSpecularGlossiness.diffuseFactor;
            if (diffuseColor !== undefined) {
                material.color = new OV.Color (
                    GetMaterialComponent (diffuseColor[0]),
                    GetMaterialComponent (diffuseColor[1]),
                    GetMaterialComponent (diffuseColor[2])
                );
                material.opacity = diffuseColor[3];
            }
            let diffuseTexture = khrSpecularGlossiness.diffuseTexture;
            if (diffuseTexture !== undefined) {
                material.diffuseMap = imporTextureFn (diffuseTexture);
            }
            let specularColor = khrSpecularGlossiness.specularFactor;
            if (specularColor !== undefined) {
                material.specular = new OV.Color (
                    GetMaterialComponent (specularColor[0]),
                    GetMaterialComponent (specularColor[1]),
                    GetMaterialComponent (specularColor[2])
                );
            }
            let specularTexture = khrSpecularGlossiness.specularGlossinessTexture;
            if (specularTexture !== undefined) {
                material.specularMap = imporTextureFn (specularTexture);
            }            
            let glossiness = khrSpecularGlossiness.glossinessFactor;
            if (glossiness !== undefined) {
                material.shininess = glossiness;
            }
        }
    }

    ProcessTexture (gltfTexture, texture)
    {
        if (gltfTexture.extensions === undefined) {
            return;
        }
        let khrTextureTransform = gltfTexture.extensions.KHR_texture_transform;
        if (khrTextureTransform !== undefined) {
            if (khrTextureTransform.offset !== undefined) {
                texture.offset.x = khrTextureTransform.offset[0];
                texture.offset.y = -khrTextureTransform.offset[1];
            }
            if (khrTextureTransform.scale !== undefined) {
                texture.scale.x = khrTextureTransform.scale[0];
                texture.scale.y = khrTextureTransform.scale[1];
            }
            if (khrTextureTransform.rotation !== undefined) {
                texture.rotation = -khrTextureTransform.rotation;
            }
        }
    }

    ProcessPrimitive (importer, gltf, primitive, mesh)
    {
        function EnumerateComponents (draco, decoder, dracoMesh, attributeId, processor)
        {
            let attribute = decoder.GetAttributeByUniqueId (dracoMesh, attributeId);
            let numComponents = attribute.num_components ();
            let numPoints = dracoMesh.num_points ();
            let numValues = numPoints * numComponents;
            let dataSize = numValues * 4;
            let attributePtr = draco._malloc (dataSize);
            decoder.GetAttributeDataArrayForAllPoints (dracoMesh, attribute, draco.DT_FLOAT32, dataSize, attributePtr);
            let attributeArray = new Float32Array (draco.HEAPF32.buffer, attributePtr, numValues).slice ();
            if (numComponents === 2) {
                for (let i = 0; i < attributeArray.length; i += 2) {
                    processor (new OV.Coord2D (
                        attributeArray[i + 0],
                        attributeArray[i + 1]
                    ));
                }
            } else if (numComponents === 3) {
                for (let i = 0; i < attributeArray.length; i += 3) {
                    processor (new OV.Coord3D (
                        attributeArray[i + 0],
                        attributeArray[i + 1],
                        attributeArray[i + 2]
                    ));
                }
            }
            draco._free (attributePtr);
        }

        if (this.draco === null) {
            return false;
        }

        if (primitive.extensions === undefined || primitive.extensions.KHR_draco_mesh_compression === undefined) {
            return false;
        }

        let decoder = new this.draco.Decoder ();
        let decoderBuffer = new this.draco.DecoderBuffer ();

        let extensionParams = primitive.extensions.KHR_draco_mesh_compression;
        let compressedBufferView = gltf.bufferViews[extensionParams.bufferView];
        let compressedReader = importer.GetReaderFromBufferView (compressedBufferView);
        let compressedArrayBuffer = compressedReader.ReadArrayBuffer (compressedBufferView.byteLength);
        decoderBuffer.Init (new Int8Array (compressedArrayBuffer), compressedArrayBuffer.byteLength);
        let geometryType = decoder.GetEncodedGeometryType (decoderBuffer);
        if (geometryType !== this.draco.TRIANGULAR_MESH) {
            return true;
        }

        let dracoMesh = new this.draco.Mesh ();
        let decodingStatus = decoder.DecodeBufferToMesh (decoderBuffer, dracoMesh);
        if (!decodingStatus.ok ()) {
            return true;
        }

        let hasVertices = (extensionParams.attributes.POSITION !== undefined);
        let hasNormals = (extensionParams.attributes.NORMAL !== undefined);
        let hasUVs = (extensionParams.attributes.TEXCOORD_0 !== undefined);

        if (!hasVertices) {
            return true;
        }

        let vertexOffset = mesh.VertexCount ();
        let normalOffset = mesh.NormalCount ();
        let uvOffset = mesh.TextureUVCount ();

        EnumerateComponents (this.draco, decoder, dracoMesh, extensionParams.attributes.POSITION, (vertex) => {
            mesh.AddVertex (vertex);
        });

        if (hasNormals) {
            EnumerateComponents (this.draco, decoder, dracoMesh, extensionParams.attributes.NORMAL, (normal) => {
                mesh.AddNormal (normal);
            });
        }

        if (hasUVs) {
            EnumerateComponents (this.draco, decoder, dracoMesh, extensionParams.attributes.TEXCOORD_0, (uv) => {
                uv.y = -uv.y;
                mesh.AddTextureUV (uv);
            });
        }

        let faceCount = dracoMesh.num_faces ();
        let indexCount = faceCount * 3;
        let indexDataSize = indexCount * 4;
        let indexDataPtr = this.draco._malloc (indexDataSize);
        decoder.GetTrianglesUInt32Array (dracoMesh, indexDataSize, indexDataPtr);
        let indexArray = new Uint32Array (this.draco.HEAPU32.buffer, indexDataPtr, indexCount).slice ();
        for (let i = 0; i < indexArray.length; i += 3) {
            let v0 = indexArray[i];
            let v1 = indexArray[i + 1];
            let v2 = indexArray[i + 2];
            importer.AddTriangle (primitive, mesh, v0, v1, v2, hasNormals, hasUVs, vertexOffset, normalOffset, uvOffset);
        }
        this.draco._free (indexDataPtr);

        return true;
    }
};

OV.ImporterGltf = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
        this.gltfExtensions = new OV.GltfExtensions ();
    }

    CanImportExtension (extension)
    {
        return extension === 'gltf' || extension === 'glb';
    }

    GetKnownFileFormats ()
    {
        return {
            'gltf' : OV.FileFormat.Text,
            'glb' : OV.FileFormat.Binary,
            'bin' : OV.FileFormat.Binary
        };
    }

    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
    
    ClearContent ()
    {
        this.bufferContents = null;
        this.imageIndexToTextureParams = null;
    }

    ResetContent ()
    {
        this.bufferContents = [];
        this.imageIndexToTextureParams = {};
    }

    ImportContent (fileContent, onFinish)
    {
        if (this.extension === 'gltf') {
            this.ProcessGltf (fileContent, onFinish);
        } else if (this.extension === 'glb') {
            this.ProcessBinaryGltf (fileContent, onFinish);
        }
    }

    ProcessGltf (fileContent, onFinish)
    {
        let gltf = JSON.parse (fileContent);
        if (gltf.asset.version !== '2.0') {
            this.SetError ();
            this.SetMessage ('Invalid glTF version.');
            onFinish ();
            return;
        }

        for (let i = 0; i < gltf.buffers.length; i++) {
            let buffer = null;
            let gltfBuffer = gltf.buffers[i];
            let base64Buffer = OV.Base64DataURIToArrayBuffer (gltfBuffer.uri);
            if (base64Buffer !== null) {
                buffer = base64Buffer.buffer;
            } else {
                let fileBuffer = this.callbacks.getFileBuffer (gltfBuffer.uri);
                if (fileBuffer !== null) {
                    buffer = fileBuffer;
                }
            }
            if (buffer === null) {
                this.SetError ();
                this.SetMessage ('One  of the requested buffers is missing.');
                onFinish ();
                return;
            }
            this.bufferContents.push (buffer);
        }

        this.ProcessMainFile (gltf, onFinish);
    }

    ProcessBinaryGltf (fileContent, onFinish)
    {
        function ReadChunk (reader)
        {
            let length = reader.ReadUnsignedInteger32 ();
            let type = reader.ReadUnsignedInteger32 ();
            let buffer = reader.ReadArrayBuffer (length);
            return {
                type : type,
                buffer : buffer
            };
        }

        let reader = new OV.BinaryReader (fileContent, true);
        let magic = reader.ReadUnsignedInteger32 ();
        if (magic !== OV.GltfConstants.GLTF_STRING) {
            this.SetError ();
            this.SetMessage ('Invalid glTF file.');
            onFinish ();
            return;
        }
        let version = reader.ReadUnsignedInteger32 ();
        if (version !== 2) {
            this.SetError ();
            this.SetMessage ('Invalid glTF version.');
            onFinish ();
            return;
        }
        let length = reader.ReadUnsignedInteger32 ();
        if (length !== reader.GetByteLength ()) {
            this.SetError ();
            this.SetMessage ('Invalid glTF file.');
            onFinish ();
            return;
        }

        let gltfTextContent = null;
        while (!reader.End ()) {
            let chunk = ReadChunk (reader);
            if (chunk.type === OV.GltfConstants.JSON_CHUNK_TYPE) {
                gltfTextContent = OV.ArrayBufferToUtf8String (chunk.buffer);
            } else if (chunk.type === OV.GltfConstants.BINARY_CHUNK_TYPE) {
                this.bufferContents.push (chunk.buffer);
            }
        }

        if (gltfTextContent !== null) {
            let gltf = JSON.parse (gltfTextContent);
            this.ProcessMainFile (gltf, onFinish);
        }
    }

    ProcessMainFile (gltf, onFinish)
    {
        let unsupportedExtensions = this.gltfExtensions.GetUnsupportedExtensions (gltf.extensionsRequired);
        if (unsupportedExtensions.length > 0) {
            this.SetError ();
            this.SetMessage ('Unsupported extension: ' + unsupportedExtensions.join (', ') + '.');
            onFinish ();
            return;
        }

        this.gltfExtensions.LoadLibraries (gltf.extensionsRequired, {
            onSuccess : () => {
                this.ImportModel (gltf);
                onFinish ();
            },
            onError : () => {
                this.SetError ();
                this.SetMessage ('Failed to load draco decoder.');
                onFinish ();
            }
        });
    }

    ImportModel (gltf)
    {
        let defaultScene = this.GetDefaultScene (gltf);
        if (defaultScene === null) {
            this.SetError ();
            this.SetMessage ('No default scene found.');
            return;
        }

        this.ImportModelProperties (gltf);

        let materials = gltf.materials;
        if (materials !== undefined) {
            for (let i = 0; i < materials.length; i++) {
                this.ImportMaterial (gltf, i);
            }          
        }

        let nodeTree = this.CollectMeshNodesForScene (gltf, defaultScene);
        for (let i = 0; i < nodeTree.nodes.length; i++) {
            let nodeIndex = nodeTree.nodes[i];
            this.ImportMeshNode (gltf, nodeIndex, nodeTree);
        }
    }

    ImportModelProperties (gltf)
    {
        let propertyGroup = new OV.PropertyGroup ('Asset properties');
        for (let propertyName in gltf.asset) {
            if (Object.prototype.hasOwnProperty.call (gltf.asset, propertyName)) {
                if (typeof gltf.asset[propertyName] === 'string') {
                    const property = new OV.Property (OV.PropertyType.Text, propertyName, gltf.asset[propertyName]);
                    propertyGroup.AddProperty (property);
                }
            }
        }
        if (propertyGroup.PropertyCount () > 0) {
            this.model.AddPropertyGroup (propertyGroup);
        }
    }

    GetDefaultScene (gltf)
    {
        let defaultSceneIndex = gltf.scene || 0;
        if (defaultSceneIndex >= gltf.scenes.length) {
            return null;
        }
        return gltf.scenes[defaultSceneIndex];
    }

    CollectMeshNodesForScene (gltf, scene)
    {
        function CollectMeshNodeIndices (gltf, parentIndex, nodeIndex, nodeTree, meshNodes)
        {
            let node = gltf.nodes[nodeIndex];
            if (node.mesh !== undefined) {
                nodeTree.AddMeshNode (nodeIndex);
                meshNodes.push (nodeIndex);
            }
            nodeTree.AddNodeParent (nodeIndex, parentIndex);
            if (node.children !== undefined) {
                for (let i = 0; i < node.children.length; i++) {
                    let childNodeIndex = node.children[i];
                    CollectMeshNodeIndices (gltf, nodeIndex, childNodeIndex, nodeTree, meshNodes);
                }
            }
        }

        let nodeTree = new OV.GltfNodeTree ();
        let meshNodes = [];
        for (let i = 0; i < scene.nodes.length; i++) {
            let nodeIndex = scene.nodes[i];
            CollectMeshNodeIndices (gltf, -1, nodeIndex, nodeTree, meshNodes);
        }
        return nodeTree;
    }

    ImportMaterial (gltf, materialIndex)
    {
        function GetMaterialComponent (component)
        {
            return parseInt (Math.round (OV.LinearToSRGB (component) * 255.0), 10);
        }

        let gltfMaterial = gltf.materials[materialIndex];
        let material = new OV.Material (OV.MaterialType.Physical);
        if (gltfMaterial.name !== undefined) {
            material.name = gltfMaterial.name;
        }

        material.color = new OV.Color (
            GetMaterialComponent (1.0),
            GetMaterialComponent (1.0),
            GetMaterialComponent (1.0)
        );
        if (gltfMaterial.pbrMetallicRoughness !== undefined) {
            let baseColor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
            if (baseColor !== undefined) {
                material.color = new OV.Color (
                    GetMaterialComponent (baseColor[0]),
                    GetMaterialComponent (baseColor[1]),
                    GetMaterialComponent (baseColor[2])
                );
                material.opacity = baseColor[3];
            }
            let metallicFactor = gltfMaterial.pbrMetallicRoughness.metallicFactor;
            if (metallicFactor !== undefined) {
                material.metallic = metallicFactor;
            }
            let roughnessFactor = gltfMaterial.pbrMetallicRoughness.roughnessFactor;
            if (roughnessFactor !== undefined) {
                material.roughness = roughnessFactor;
            }
            let emissiveColor = gltfMaterial.emissiveFactor;
            if (emissiveColor !== undefined) {
                material.emissive = new OV.Color (
                    GetMaterialComponent (emissiveColor[0]),
                    GetMaterialComponent (emissiveColor[1]),
                    GetMaterialComponent (emissiveColor[2])
                );
            }

            material.diffuseMap = this.ImportTexture (gltf, gltfMaterial.pbrMetallicRoughness.baseColorTexture);
            material.metalnessMap = this.ImportTexture (gltf, gltfMaterial.pbrMetallicRoughness.metallicRoughnessTexture);
            material.normalMap = this.ImportTexture (gltf, gltfMaterial.normalTexture);
            material.emissiveMap = this.ImportTexture (gltf, gltfMaterial.emissiveTexture);
            if (material.diffuseMap !== null) {
                material.multiplyDiffuseMap = true;
            }

            let alphaMode = gltfMaterial.alphaMode;
            if (alphaMode !== undefined) {
                if (alphaMode === 'BLEND') {
                    material.transparent = true;
                } else if (alphaMode === 'MASK') {
                    material.transparent = true;
                    material.alphaTest = gltfMaterial.alphaCutoff || 0.5;
                }
            }
        }

        this.gltfExtensions.ProcessMaterial (gltfMaterial, material, (textureRef) => {
            return this.ImportTexture (gltf, textureRef);
        });
        this.model.AddMaterial (material);
    }

    ImportTexture (gltf, gltfTextureRef)
    {
        function GetTextureFileExtension (mimeType)
        {
            if (mimeType === undefined || mimeType === null) {
                return '';
            }
            let mimeParts = mimeType.split ('/');
            if (mimeParts.length === 0) {
                return '';
            }
            return '.' + mimeParts[mimeParts.length - 1];
        }

        if (gltfTextureRef === undefined || gltfTextureRef === null) {
            return null;
        }

        let texture = new OV.TextureMap ();
        let gltfTexture = gltf.textures[gltfTextureRef.index];
        let gltfImageIndex = gltfTexture.source;
        let gltfImage = gltf.images[gltfImageIndex];

        let textureParams = this.imageIndexToTextureParams[gltfImageIndex];
        if (textureParams === undefined) {
            textureParams = {
                name : null,
                url : null,
                buffer : null
            };
            let textureIndexString = gltfImageIndex.toString ();
            if (gltfImage.uri !== undefined) {
                let base64Buffer = OV.Base64DataURIToArrayBuffer (gltfImage.uri);
                if (base64Buffer !== null) {
                    textureParams.name = 'Embedded_' + textureIndexString + GetTextureFileExtension (base64Buffer.mimeType);
                    textureParams.url = OV.CreateObjectUrlWithMimeType (base64Buffer.buffer, base64Buffer.mimeType);
                    textureParams.buffer = base64Buffer.buffer;
                } else {
                    let textureBuffer = this.callbacks.getTextureBuffer (gltfImage.uri);
                    textureParams.name = gltfImage.uri;
                    if (textureBuffer !== null) {
                        textureParams.url = textureBuffer.url;
                        textureParams.buffer = textureBuffer.buffer;
                    }
                }
            } else if (gltfImage.bufferView !== undefined) {
                let bufferView = gltf.bufferViews[gltfImage.bufferView];
                let reader = this.GetReaderFromBufferView (bufferView);
                if (reader !== null) {
                    let buffer = reader.ReadArrayBuffer (bufferView.byteLength);
                    textureParams.name = 'Binary_' + textureIndexString + GetTextureFileExtension (gltfImage.mimeType);
                    textureParams.url = OV.CreateObjectUrlWithMimeType (buffer, gltfImage.mimeType);
                    textureParams.buffer = buffer;
                }
            }
            this.imageIndexToTextureParams[gltfImageIndex] = textureParams;
        }

        texture.name = textureParams.name;
        texture.url = textureParams.url;
        texture.buffer = textureParams.buffer;
    
        this.gltfExtensions.ProcessTexture (gltfTextureRef, texture);
        return texture;
    }

    ImportMeshNode (gltf, nodeIndex, nodeTree)
    {
        function GetNodeTransformation (gltf, nodeIndex, nodeTree)
        {
            let node = gltf.nodes[nodeIndex];
            let matrix = nodeTree.GetNodeMatrix (nodeIndex);
            if (matrix !== null) {
                return matrix;
            }

            matrix = new OV.Matrix ().CreateIdentity ();
            if (node.matrix !== undefined) {
                matrix.Set (node.matrix);
            } else {
                let hasTransformation = false;
                let translation = [0.0, 0.0, 0.0];
                let rotation = [0.0, 0.0, 0.0, 1.0];
                let scale = [1.0, 1.0, 1.0];
                if (node.translation !== undefined) {
                    translation = node.translation;
                    hasTransformation = true;
                }
                if (node.rotation !== undefined) {
                    rotation = node.rotation;
                    hasTransformation = true;
                }
                if (node.scale !== undefined) {
                    scale = node.scale;
                    hasTransformation = true;
                }
                
                if (hasTransformation) {
                    matrix.ComposeTRS (
                        OV.ArrayToCoord3D (translation),
                        OV.ArrayToQuaternion (rotation),
                        OV.ArrayToCoord3D (scale)
                    );
                }
            }

            let parentNodeIndex = nodeTree.GetNodeParent (nodeIndex);
            if (parentNodeIndex !== null) {
                let parentMatrix = GetNodeTransformation (gltf, parentNodeIndex, nodeTree);
                matrix = matrix.MultiplyMatrix (parentMatrix);
            }

            nodeTree.AddNodeMatrix (nodeIndex, matrix);
            return matrix;            
        }

        let gltfNode = gltf.nodes[nodeIndex];
        let gltfMeshIndex = gltfNode.mesh;
        let gltfMesh = gltf.meshes[gltfMeshIndex];

        let mesh = new OV.Mesh ();
        this.model.AddMesh (mesh);
        if (gltfMesh.name !== undefined) {
            mesh.SetName (gltfMesh.name);
        } else if (gltfNode.name !== undefined) {
            mesh.SetName (gltfNode.name);
        }

        for (let i = 0; i < gltfMesh.primitives.length; i++) {
            let primitive = gltfMesh.primitives[i];
            this.ImportPrimitive (gltf, primitive, mesh);
        }

        let matrix = GetNodeTransformation (gltf, nodeIndex, nodeTree);
        let transformation = new OV.Transformation (matrix);
        OV.TransformMesh (mesh, transformation);
    }    

    ImportPrimitive (gltf, primitive, mesh)
    {
        if (this.gltfExtensions.ProcessPrimitive (this, gltf, primitive, mesh)) {
            return;
        }

        if (primitive.attributes === undefined) {
            return;
        }

        let hasVertices = (primitive.attributes.POSITION !== undefined);
        let hasNormals = (primitive.attributes.NORMAL !== undefined);
        let hasUVs = (primitive.attributes.TEXCOORD_0 !== undefined);
        let hasIndices = (primitive.indices !== undefined);

        let mode = OV.GltfRenderMode.TRIANGLES;
        if (primitive.mode !== undefined) {
            mode = primitive.mode;
        }
        if (mode !== OV.GltfRenderMode.TRIANGLES && mode !== OV.GltfRenderMode.TRIANGLE_STRIP && mode !== OV.GltfRenderMode.TRIANGLE_FAN) {
            return;
        }

        let vertexOffset = mesh.VertexCount ();
        let normalOffset = mesh.NormalCount ();
        let uvOffset = mesh.TextureUVCount ();

        if (hasVertices) {
            let accessor = gltf.accessors[primitive.attributes.POSITION];
            let reader = this.GetReaderFromAccessor (gltf, accessor);
            if (reader === null) {
                return;
            }
            reader.EnumerateData ((data) => {
                mesh.AddVertex (data);
            });
        } else {
            return;
        }

        if (hasNormals) {
            let accessor = gltf.accessors[primitive.attributes.NORMAL];
            let reader = this.GetReaderFromAccessor (gltf, accessor);
            if (reader === null) {
                return;
            }
            reader.EnumerateData ((data) => {
                mesh.AddNormal (data);
            });
        }

        if (hasUVs) {
            let accessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
            let reader = this.GetReaderFromAccessor (gltf, accessor);
            if (reader === null) {
                return;
            }
            reader.EnumerateData ((data) => {
                data.y = -data.y;
                mesh.AddTextureUV (data);
            });
        }

        let vertexIndices = [];
        if (hasIndices) {
            let accessor = gltf.accessors[primitive.indices];
            let reader = this.GetReaderFromAccessor (gltf, accessor);
            if (reader === null) {
                return;
            }
            reader.EnumerateData ((data) => {
                vertexIndices.push (data);
            });          
        } else {
            for (let i = 0; i < mesh.VertexCount (); i++) {
                vertexIndices.push (i);
            }
        }

        if (mode === OV.GltfRenderMode.TRIANGLES) {
            for (let i = 0; i < vertexIndices.length; i += 3) {
                let v0 = vertexIndices[i];
                let v1 = vertexIndices[i + 1];
                let v2 = vertexIndices[i + 2];
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasNormals, hasUVs, vertexOffset, normalOffset, uvOffset);
            }
        } else if (mode === OV.GltfRenderMode.TRIANGLE_STRIP) {
            for (let i = 0; i < vertexIndices.length - 2; i++) {
                let v0 = vertexIndices[i];
                let v1 = vertexIndices[i + 1];
                let v2 = vertexIndices[i + 2];
                if (i % 2 === 1) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = tmp;
                }
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasNormals, hasUVs, vertexOffset, normalOffset, uvOffset);
            }
        } else if (mode === OV.GltfRenderMode.TRIANGLE_FAN) {
            for (let i = 1; i < vertexIndices.length - 1; i++) {
                let v0 = vertexIndices[0];
                let v1 = vertexIndices[i];
                let v2 = vertexIndices[i + 1];
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasNormals, hasUVs, vertexOffset, normalOffset, uvOffset);
            }
        }
    }

    AddTriangle (primitive, mesh, v0, v1, v2, hasNormals, hasUVs, vertexOffset, normalOffset, uvOffset)
    {
        let triangle = new OV.Triangle (vertexOffset + v0, vertexOffset + v1, vertexOffset + v2);
        if (hasNormals) {
            triangle.SetNormals (
                normalOffset + v0,
                normalOffset + v1,
                normalOffset + v2
            );
        }
        if (hasUVs) {
            triangle.SetTextureUVs (
                uvOffset + v0,
                uvOffset + v1,
                uvOffset + v2
            );
        }
        if (primitive.material !== undefined) {
            triangle.mat = primitive.material;
        }
        mesh.AddTriangle (triangle);
    }    

    GetReaderFromBufferView (bufferView)
    {
        let bufferIndex = bufferView.buffer || 0;
        let buffer = this.bufferContents[bufferIndex];
        if (buffer === undefined || buffer === null) {
            return null;
        }

        let reader = new OV.GltfBufferReader (buffer);
        reader.SkipBytes (bufferView.byteOffset || 0);
        let byteStride = bufferView.byteStride;
        if (byteStride !== undefined && byteStride !== 0) {
            reader.SetByteStride (byteStride);
        }

        return reader;
    }

    GetReaderFromAccessor (gltf, accessor)
    {
        let bufferViewIndex = accessor.bufferView || 0;
        let bufferView = gltf.bufferViews[bufferViewIndex];
        let reader = this.GetReaderFromBufferView (bufferView);
        if (reader === null) {
            return null;
        }

        reader.SetComponentType (accessor.componentType);
        reader.SetDataType (accessor.type);
        reader.SetDataCount (accessor.count);
        reader.SkipBytes (accessor.byteOffset || 0);

        if (accessor.sparse !== undefined) {
            let indexReader = this.GetReaderFromSparseAccessor (gltf, accessor.sparse.indices, accessor.sparse.indices.componentType, 'SCALAR', accessor.sparse.count);
            let valueReader = this.GetReaderFromSparseAccessor (gltf, accessor.sparse.values, accessor.componentType, accessor.type, accessor.sparse.count);
            if (indexReader !== null && valueReader !== null) {
                reader.SetSparseReader (indexReader, valueReader);
            }
        }
        return reader;
    }

    GetReaderFromSparseAccessor (gltf, sparseAccessor, componentType, type, count)
    {
        if (sparseAccessor.bufferView === undefined) {
            return null;
        }

        let bufferView = gltf.bufferViews[sparseAccessor.bufferView];
        let reader = this.GetReaderFromBufferView (bufferView);
        if (reader === null) {
            return null;
        }
        
        reader.SetComponentType (componentType);
        reader.SetDataType (type);
        reader.SetDataCount (count);
        reader.SkipBytes (sparseAccessor.byteOffset || 0);
        return reader;
    }
};
