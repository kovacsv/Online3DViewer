import { Coord2D } from '../geometry/coord2d.js';
import { ArrayToCoord3D, Coord3D } from '../geometry/coord3d.js';
import { Coord4D } from '../geometry/coord4d.js';
import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { ArrayToQuaternion } from '../geometry/quaternion.js';
import { Transformation } from '../geometry/transformation.js';
import { BinaryReader } from '../io/binaryreader.js';
import { ArrayBufferToUtf8String, Base64DataURIToArrayBuffer, GetFileExtensionFromMimeType } from '../io/bufferutils.js';
import { RGBColor, ColorComponentFromFloat, RGBColorFromFloatComponents, LinearToSRGB } from '../model/color.js';
import { PhongMaterial, PhysicalMaterial, TextureMap } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Node } from '../model/node.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { Loc, FLoc } from '../core/localization.js';
import { LoadExternalLibrary } from './importerutils.js';

const GltfComponentType =
{
    BYTE : 5120,
    UNSIGNED_BYTE : 5121,
    SHORT : 5122,
    UNSIGNED_SHORT : 5123,
    UNSIGNED_INT : 5125,
    FLOAT : 5126
};

const GltfDataType =
{
    SCALAR : 0,
    VEC2 : 1,
    VEC3 : 2,
    VEC4 : 3,
    MAT2 : 4,
    MAT3  : 5,
    MAT4  : 6
};

const GltfRenderMode =
{
    POINTS : 0,
    LINES : 1,
    LINE_LOOP : 2,
    LINE_STRIP : 3,
    TRIANGLES : 4,
    TRIANGLE_STRIP  : 5,
    TRIANGLE_FAN : 6
};

const GltfConstants =
{
    GLTF_STRING : 0x46546C67,
    JSON_CHUNK_TYPE : 0x4E4F534A,
    BINARY_CHUNK_TYPE : 0x004E4942
};

function GetGltfColor (color)
{
    return RGBColorFromFloatComponents (
        LinearToSRGB (color[0]),
        LinearToSRGB (color[1]),
        LinearToSRGB (color[2])
    );
}

function GetGltfVertexColor (color, componentType)
{
    function GetColorComponent (component, componentType)
    {
        let normalized = component;
        if (componentType === GltfComponentType.UNSIGNED_BYTE) {
            normalized /= 255.0;
        } else if (componentType === GltfComponentType.UNSIGNED_SHORT) {
            normalized /= 65535.0;
        }
        return ColorComponentFromFloat (LinearToSRGB (normalized));
    }

    return new RGBColor (
        GetColorComponent (color[0], componentType),
        GetColorComponent (color[1], componentType),
        GetColorComponent (color[2], componentType)
    );
}

class GltfBufferReader
{
    constructor (buffer)
    {
        this.reader = new BinaryReader (buffer, true);
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
            this.dataType = GltfDataType.SCALAR;
        } else if (dataType === 'VEC2') {
            this.dataType = GltfDataType.VEC2;
        } else if (dataType === 'VEC3') {
            this.dataType = GltfDataType.VEC3;
        } else if (dataType === 'VEC4') {
            this.dataType = GltfDataType.VEC4;
        } else if (dataType === 'MAT2') {
            this.dataType = GltfDataType.MAT2;
        } else if (dataType === 'MAT3') {
            this.dataType = GltfDataType.MAT3;
        } else if (dataType === 'MAT4') {
            this.dataType = GltfDataType.MAT4;
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
        if (this.dataType === GltfDataType.SCALAR) {
            let data = this.ReadComponent ();
            this.SkipBytesByStride (1);
            return data;
        } else if (this.dataType === GltfDataType.VEC2) {
            let x = this.ReadComponent ();
            let y = this.ReadComponent ();
            this.SkipBytesByStride (2);
            return new Coord2D (x, y);
        } else if (this.dataType === GltfDataType.VEC3) {
            let x = this.ReadComponent ();
            let y = this.ReadComponent ();
            let z = this.ReadComponent ();
            this.SkipBytesByStride (3);
            return new Coord3D (x, y, z);
        } else if (this.dataType === GltfDataType.VEC4) {
            let x = this.ReadComponent ();
            let y = this.ReadComponent ();
            let z = this.ReadComponent ();
            let w = this.ReadComponent ();
            this.SkipBytesByStride (4);
            return new Coord4D (x, y, z, w);
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
        if (this.componentType === GltfComponentType.BYTE) {
            return this.reader.ReadCharacter8 ();
        } else if (this.componentType === GltfComponentType.UNSIGNED_BYTE) {
            return this.reader.ReadUnsignedCharacter8 ();
        } else if (this.componentType === GltfComponentType.SHORT) {
            return this.reader.ReadInteger16 ();
        } else if (this.componentType === GltfComponentType.UNSIGNED_SHORT) {
            return this.reader.ReadUnsignedInteger16 ();
        } else if (this.componentType === GltfComponentType.UNSIGNED_INT) {
            return this.reader.ReadInteger32 ();
        } else if (this.componentType === GltfComponentType.FLOAT) {
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
        if (this.componentType === GltfComponentType.BYTE) {
            return 1;
        } else if (this.componentType === GltfComponentType.UNSIGNED_BYTE) {
            return 1;
        } else if (this.componentType === GltfComponentType.SHORT) {
            return 2;
        } else if (this.componentType === GltfComponentType.UNSIGNED_SHORT) {
            return 2;
        } else if (this.componentType === GltfComponentType.UNSIGNED_INT) {
            return 4;
        } else if (this.componentType === GltfComponentType.FLOAT) {
            return 4;
        }
        return 0;
    }
}

class GltfExtensions
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
			LoadExternalLibrary ('draco3d').then (() => {
                DracoDecoderModule ().then ((draco) => {
                    this.draco = draco;
                    callbacks.onSuccess ();
                });
            }).catch (() => {
                callbacks.onError (Loc ('Failed to load draco decoder.'));
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
        if (gltfMaterial.extensions === undefined) {
            return null;
        }

        let khrSpecularGlossiness = gltfMaterial.extensions.KHR_materials_pbrSpecularGlossiness;
        if (khrSpecularGlossiness === undefined) {
            return null;
        }

        let phongMaterial = new PhongMaterial ();
        let diffuseColor = khrSpecularGlossiness.diffuseFactor;
        if (diffuseColor !== undefined) {
            phongMaterial.color = GetGltfColor (diffuseColor);
            phongMaterial.opacity = diffuseColor[3];
        }
        let diffuseTexture = khrSpecularGlossiness.diffuseTexture;
        if (diffuseTexture !== undefined) {
            phongMaterial.diffuseMap = imporTextureFn (diffuseTexture);
        }
        let specularColor = khrSpecularGlossiness.specularFactor;
        if (specularColor !== undefined) {
            phongMaterial.specular = GetGltfColor (specularColor);
        }
        let specularTexture = khrSpecularGlossiness.specularGlossinessTexture;
        if (specularTexture !== undefined) {
            phongMaterial.specularMap = imporTextureFn (specularTexture);
        }
        let glossiness = khrSpecularGlossiness.glossinessFactor;
        if (glossiness !== undefined) {
            phongMaterial.shininess = glossiness;
        }

        return phongMaterial;
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
                    processor (new Coord2D (
                        attributeArray[i + 0],
                        attributeArray[i + 1]
                    ));
                }
            } else if (numComponents === 3) {
                for (let i = 0; i < attributeArray.length; i += 3) {
                    processor (new Coord3D (
                        attributeArray[i + 0],
                        attributeArray[i + 1],
                        attributeArray[i + 2]
                    ));
                }
            } else if (numComponents === 4) {
                for (let i = 0; i < attributeArray.length; i += 4) {
                    processor (new Coord4D (
                        attributeArray[i + 0],
                        attributeArray[i + 1],
                        attributeArray[i + 2],
                        attributeArray[i + 3]
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
        let hasVertexColors = false;
        let hasNormals = (extensionParams.attributes.NORMAL !== undefined);
        let hasUVs = (extensionParams.attributes.TEXCOORD_0 !== undefined);

        if (!hasVertices) {
            return true;
        }

        let vertexOffset = mesh.VertexCount ();
        let vertexColorOffset = mesh.VertexColorCount ();
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
            importer.AddTriangle (primitive, mesh, v0, v1, v2, hasVertexColors, hasNormals, hasUVs, vertexOffset, vertexColorOffset, normalOffset, uvOffset);
        }
        this.draco._free (indexDataPtr);

        return true;
    }
}

export class ImporterGltf extends ImporterBase
{
    constructor ()
    {
        super ();
        this.gltfExtensions = new GltfExtensions ();
    }

    CanImportExtension (extension)
    {
        return extension === 'gltf' || extension === 'glb';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    ClearContent ()
    {
        this.bufferContents = null;
        this.imageIndexToTextureParams = null;
    }

    ResetContent ()
    {
        this.bufferContents = [];
        this.imageIndexToTextureParams = new Map ();
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
        let textContent = ArrayBufferToUtf8String (fileContent);
        let gltf = JSON.parse (textContent);
        if (gltf.asset.version !== '2.0') {
            this.SetError (Loc ('Invalid glTF version.'));
            onFinish ();
            return;
        }

        for (let i = 0; i < gltf.buffers.length; i++) {
            let buffer = null;
            let gltfBuffer = gltf.buffers[i];
            let base64Buffer = Base64DataURIToArrayBuffer (gltfBuffer.uri);
            if (base64Buffer !== null) {
                buffer = base64Buffer.buffer;
            } else {
                let fileBuffer = this.callbacks.getFileBuffer (gltfBuffer.uri);
                if (fileBuffer !== null) {
                    buffer = fileBuffer;
                }
            }
            if (buffer === null) {
                this.SetError (Loc ('One of the requested buffers is missing.'));
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

        let reader = new BinaryReader (fileContent, true);
        let magic = reader.ReadUnsignedInteger32 ();
        if (magic !== GltfConstants.GLTF_STRING) {
            this.SetError (Loc ('Invalid glTF file.'));
            onFinish ();
            return;
        }
        let version = reader.ReadUnsignedInteger32 ();
        if (version !== 2) {
            this.SetError (Loc ('Invalid glTF version.'));
            onFinish ();
            return;
        }
        let length = reader.ReadUnsignedInteger32 ();
        if (length !== reader.GetByteLength ()) {
            this.SetError (Loc ('Invalid glTF file.'));
            onFinish ();
            return;
        }

        let gltfTextContent = null;
        while (!reader.End ()) {
            let chunk = ReadChunk (reader);
            if (chunk.type === GltfConstants.JSON_CHUNK_TYPE) {
                gltfTextContent = ArrayBufferToUtf8String (chunk.buffer);
            } else if (chunk.type === GltfConstants.BINARY_CHUNK_TYPE) {
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
            this.SetError (FLoc ('Unsupported extension: {0}.', unsupportedExtensions.join (', ')));
            onFinish ();
            return;
        }

        this.gltfExtensions.LoadLibraries (gltf.extensionsRequired, {
            onSuccess : () => {
                this.ImportModel (gltf);
                onFinish ();
            },
            onError : (message) => {
                this.SetError (message);
                onFinish ();
            }
        });
    }

    ImportModel (gltf)
    {
        let materials = gltf.materials;
        if (materials !== undefined) {
            for (let material of materials) {
                this.ImportMaterial (gltf, material);
            }
        }

        let meshes = gltf.meshes;
        if (meshes !== undefined) {
            for (let mesh of meshes) {
                this.ImportMesh (gltf, mesh);
            }
        }

        this.ImportProperties (this.model, gltf.asset, Loc ('Asset properties'));
        this.ImportScene (gltf);
    }

    ImportProperties (modelObject, gltfObject, propertyGroupName)
    {
        if (gltfObject === undefined || gltfObject === null) {
            return;
        }

        let propertyGroup = new PropertyGroup (propertyGroupName);
        for (let propertyName in gltfObject) {
            if (Object.prototype.hasOwnProperty.call (gltfObject, propertyName)) {
                let property = null;
                let propertyValue = gltfObject[propertyName];
                if (typeof propertyValue === 'string') {
                    property = new Property (PropertyType.Text, propertyName, propertyValue);
                } else if (typeof propertyValue === 'number') {
                    if (Number.isInteger (propertyValue)) {
                        property = new Property (PropertyType.Integer, propertyName, propertyValue);
                    } else {
                        property = new Property (PropertyType.Number, propertyName, propertyValue);
                    }
                }
                if (property !== null) {
                    propertyGroup.AddProperty (property);
                }
            }
        }

        if (propertyGroup.PropertyCount () === 0) {
            return;
        }

        modelObject.AddPropertyGroup (propertyGroup);
    }

    GetDefaultScene (gltf)
    {
        let defaultSceneIndex = gltf.scene || 0;
        if (defaultSceneIndex >= gltf.scenes.length) {
            return null;
        }
        return gltf.scenes[defaultSceneIndex];
    }

    ImportMaterial (gltf, gltfMaterial)
    {
        let material = new PhysicalMaterial ();
        if (gltfMaterial.name !== undefined) {
            material.name = gltfMaterial.name;
        }

        material.color = GetGltfColor ([1.0, 1.0, 1.0]);
        if (gltfMaterial.pbrMetallicRoughness !== undefined) {
            let baseColor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
            if (baseColor !== undefined) {
                material.color = GetGltfColor (baseColor);
                material.opacity = baseColor[3];
            }
            let metallicFactor = gltfMaterial.pbrMetallicRoughness.metallicFactor;
            if (metallicFactor !== undefined) {
                material.metalness = metallicFactor;
            }
            let roughnessFactor = gltfMaterial.pbrMetallicRoughness.roughnessFactor;
            if (roughnessFactor !== undefined) {
                material.roughness = roughnessFactor;
            }
            let emissiveColor = gltfMaterial.emissiveFactor;
            if (emissiveColor !== undefined) {
                material.emissive = GetGltfColor (emissiveColor);
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

        let newMaterial = this.gltfExtensions.ProcessMaterial (gltfMaterial, material, (textureRef) => {
            return this.ImportTexture (gltf, textureRef);
        });
        if (newMaterial !== null) {
            material = newMaterial;
        }
        this.model.AddMaterial (material);
    }

    ImportTexture (gltf, gltfTextureRef)
    {
        if (gltfTextureRef === undefined || gltfTextureRef === null) {
            return null;
        }

        let texture = new TextureMap ();
        let gltfTexture = gltf.textures[gltfTextureRef.index];
        let gltfImageIndex = gltfTexture.source;
        let gltfImage = gltf.images[gltfImageIndex];

        let textureParams = null;
        if (this.imageIndexToTextureParams.has (gltfImageIndex)) {
            textureParams = this.imageIndexToTextureParams.get (gltfImageIndex);
        } else {
            textureParams = {
                name : null,
                mimeType : null,
                buffer : null
            };
            let textureIndexString = gltfImageIndex.toString ();
            if (gltfImage.uri !== undefined) {
                let base64Buffer = Base64DataURIToArrayBuffer (gltfImage.uri);
                if (base64Buffer !== null) {
                    textureParams.name = 'Embedded_' + textureIndexString + '.' + GetFileExtensionFromMimeType (base64Buffer.mimeType);
                    textureParams.mimeType = base64Buffer.mimeType;
                    textureParams.buffer = base64Buffer.buffer;
                } else {
                    let textureBuffer = this.callbacks.getFileBuffer (gltfImage.uri);
                    textureParams.name = gltfImage.uri;
                    textureParams.buffer = textureBuffer;
                }
            } else if (gltfImage.bufferView !== undefined) {
                let bufferView = gltf.bufferViews[gltfImage.bufferView];
                let reader = this.GetReaderFromBufferView (bufferView);
                if (reader !== null) {
                    let buffer = reader.ReadArrayBuffer (bufferView.byteLength);
                    textureParams.name = 'Binary_' + textureIndexString + '.' + GetFileExtensionFromMimeType (gltfImage.mimeType);
                    textureParams.mimeType = gltfImage.mimeType;
                    textureParams.buffer = buffer;
                }
            }
            this.imageIndexToTextureParams.set (gltfImageIndex, textureParams);
        }

        texture.name = textureParams.name;
        texture.mimeType = textureParams.mimeType;
        texture.buffer = textureParams.buffer;

        this.gltfExtensions.ProcessTexture (gltfTextureRef, texture);
        return texture;
    }

    ImportMesh (gltf, gltfMesh)
    {
        let mesh = new Mesh ();

        this.model.AddMesh (mesh);
        if (gltfMesh.name !== undefined) {
            mesh.SetName (gltfMesh.name);
        }

        for (let i = 0; i < gltfMesh.primitives.length; i++) {
            let primitive = gltfMesh.primitives[i];
            this.ImportPrimitive (gltf, primitive, mesh);
        }

        this.ImportProperties (mesh, gltfMesh.extras, Loc ('Mesh properties'));
    }

    ImportPrimitive (gltf, primitive, mesh)
    {
        function HasAttribute (gltf, primitive, attributeName)
        {
            let accessorIndex = primitive.attributes[attributeName];
            if (accessorIndex === undefined) {
                return false;
            }
            let accessor = gltf.accessors[accessorIndex];
            if (accessor === undefined || accessor.count === 0) {
                return false;
            }
            return true;
        }

        if (this.gltfExtensions.ProcessPrimitive (this, gltf, primitive, mesh)) {
            return;
        }

        if (primitive.attributes === undefined) {
            return;
        }

        let hasVertices = HasAttribute (gltf, primitive, 'POSITION');
        let hasVertexColors = HasAttribute (gltf, primitive, 'COLOR_0');
        let hasNormals = HasAttribute (gltf, primitive, 'NORMAL');
        let hasUVs = HasAttribute (gltf, primitive, 'TEXCOORD_0');
        let hasIndices = (primitive.indices !== undefined);

        let mode = GltfRenderMode.TRIANGLES;
        if (primitive.mode !== undefined) {
            mode = primitive.mode;
        }
        if (mode !== GltfRenderMode.TRIANGLES && mode !== GltfRenderMode.TRIANGLE_STRIP && mode !== GltfRenderMode.TRIANGLE_FAN) {
            return;
        }

        let vertexOffset = mesh.VertexCount ();
        let vertexColorOffset = mesh.VertexColorCount ();
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

        let vertexCount = mesh.VertexCount () - vertexOffset;

        if (hasVertexColors) {
            let accessor = gltf.accessors[primitive.attributes.COLOR_0];
            let reader = this.GetReaderFromAccessor (gltf, accessor);
            if (reader === null) {
                return;
            }
            reader.EnumerateData ((data) => {
                let color = GetGltfVertexColor ([data.x, data.y, data.z], reader.componentType);
                mesh.AddVertexColor (color);
            });
            if (mesh.VertexColorCount () - vertexColorOffset !== vertexCount) {
                hasVertexColors = false;
            }
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
            if (mesh.NormalCount () - normalOffset !== vertexCount) {
                hasNormals = false;
            }
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
            if (mesh.TextureUVCount () - uvOffset !== vertexCount) {
                hasUVs = false;
            }
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
            let primitiveVertexCount = mesh.VertexCount () - vertexOffset;
            for (let i = 0; i < primitiveVertexCount; i++) {
                vertexIndices.push (i);
            }
        }

        if (mode === GltfRenderMode.TRIANGLES) {
            for (let i = 0; i < vertexIndices.length; i += 3) {
                let v0 = vertexIndices[i];
                let v1 = vertexIndices[i + 1];
                let v2 = vertexIndices[i + 2];
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasVertexColors, hasNormals, hasUVs, vertexOffset, vertexColorOffset, normalOffset, uvOffset);
            }
        } else if (mode === GltfRenderMode.TRIANGLE_STRIP) {
            for (let i = 0; i < vertexIndices.length - 2; i++) {
                let v0 = vertexIndices[i];
                let v1 = vertexIndices[i + 1];
                let v2 = vertexIndices[i + 2];
                if (i % 2 === 1) {
                    let tmp = v1;
                    v1 = v2;
                    v2 = tmp;
                }
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasVertexColors, hasNormals, hasUVs, vertexOffset, vertexColorOffset, normalOffset, uvOffset);
            }
        } else if (mode === GltfRenderMode.TRIANGLE_FAN) {
            for (let i = 1; i < vertexIndices.length - 1; i++) {
                let v0 = vertexIndices[0];
                let v1 = vertexIndices[i];
                let v2 = vertexIndices[i + 1];
                this.AddTriangle (primitive, mesh, v0, v1, v2, hasVertexColors, hasNormals, hasUVs, vertexOffset, vertexColorOffset, normalOffset, uvOffset);
            }
        }
    }

    AddTriangle (primitive, mesh, v0, v1, v2, hasVertexColors, hasNormals, hasUVs, vertexOffset, vertexColorOffset, normalOffset, uvOffset)
    {
        let triangle = new Triangle (
            vertexOffset + v0,
            vertexOffset + v1,
            vertexOffset + v2
        );
        if (hasVertexColors) {
            triangle.SetVertexColors (
                vertexColorOffset + v0,
                vertexColorOffset + v1,
                vertexColorOffset + v2
            );
        }
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

    ImportScene (gltf)
    {
        let scene = this.GetDefaultScene (gltf);
        if (scene === null) {
            return;
        }

        let rootNode = this.model.GetRootNode ();
        for (let nodeIndex of scene.nodes) {
            let gltfNode = gltf.nodes[nodeIndex];
            this.ImportNode (gltf, gltfNode, rootNode);
        }

        this.ImportProperties (this.model, scene.extras, Loc ('Scene properties'));
    }

    ImportNode (gltf, gltfNode, parentNode)
    {
        function GetNodeTransformation (gltfNode)
        {
            let matrix = new Matrix ().CreateIdentity ();
            if (gltfNode.matrix !== undefined) {
                matrix.Set (gltfNode.matrix);
            } else {
                let translation = [0.0, 0.0, 0.0];
                let rotation = [0.0, 0.0, 0.0, 1.0];
                let scale = [1.0, 1.0, 1.0];
                if (gltfNode.translation !== undefined) {
                    translation = gltfNode.translation;
                }
                if (gltfNode.rotation !== undefined) {
                    rotation = gltfNode.rotation;
                }
                if (gltfNode.scale !== undefined) {
                    scale = gltfNode.scale;
                }
                matrix.ComposeTRS (
                    ArrayToCoord3D (translation),
                    ArrayToQuaternion (rotation),
                    ArrayToCoord3D (scale)
                );
            }
            return new Transformation (matrix);
        }

        if (gltfNode.children === undefined && gltfNode.mesh === undefined) {
            return;
        }

        let node = new Node ();
        if (gltfNode.name !== undefined) {
            node.SetName (gltfNode.name);
        }
        node.SetTransformation (GetNodeTransformation (gltfNode));
        parentNode.AddChildNode (node);

        if (gltfNode.children !== undefined) {
            for (let childIndex of gltfNode.children) {
                let childGltfNode = gltf.nodes[childIndex];
                this.ImportNode (gltf, childGltfNode, node);
            }
        }

        if (gltfNode.mesh !== undefined) {
            let mesh = this.model.GetMesh (gltfNode.mesh);
            this.ImportProperties (mesh, gltfNode.extras, Loc ('Node properties'));
            node.AddMeshIndex (gltfNode.mesh);
        }
    }

    GetReaderFromBufferView (bufferView)
    {
        let bufferIndex = bufferView.buffer || 0;
        let buffer = this.bufferContents[bufferIndex];
        if (buffer === undefined || buffer === null) {
            return null;
        }

        let reader = new GltfBufferReader (buffer);
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
}
