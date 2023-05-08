import { Coord2D } from '../geometry/coord2d.js';
import { ArrayToCoord3D, Coord3D } from '../geometry/coord3d.js';
import { DegRad, Direction, IsNegative } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { ArrayToQuaternion } from '../geometry/quaternion.js';
import { Transformation } from '../geometry/transformation.js';
import { BinaryReader } from '../io/binaryreader.js';
import { RGBColor, ColorComponentFromFloat } from '../model/color.js';
import { PhongMaterial, TextureMap } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { FlipMeshTrianglesOrientation, TransformMesh } from '../model/meshutils.js';
import { Node } from '../model/node.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { UpdateMaterialTransparency } from './importerutils.js';

const CHUNK3DS =
{
    MAIN3DS : 0x4D4D,
    EDIT3DS : 0x3D3D,
    EDIT_MATERIAL : 0xAFFF,
    MAT_NAME : 0xA000,
    MAT_AMBIENT : 0xA010,
    MAT_DIFFUSE : 0xA020,
    MAT_SPECULAR : 0xA030,
    MAT_SHININESS : 0xA040,
    MAT_SHININESS_STRENGTH : 0xA041,
    MAT_TRANSPARENCY : 0xA050,
    MAT_COLOR_F : 0x0010,
    MAT_COLOR : 0x0011,
    MAT_LIN_COLOR : 0x0012,
    MAT_LIN_COLOR_F : 0x0013,
    MAT_TEXMAP : 0xA200,
    MAT_TEXMAP_NAME : 0xA300,
    MAT_TEXMAP_UOFFSET : 0xA358,
    MAT_TEXMAP_VOFFSET : 0xA35A,
    MAT_TEXMAP_USCALE : 0xA354,
    MAT_TEXMAP_VSCALE : 0xA356,
    MAT_TEXMAP_ROTATION : 0xA35C,
    PERCENTAGE : 0x0030,
    PERCENTAGE_F : 0x0031,
    EDIT_OBJECT : 0x4000,
    OBJ_TRIMESH : 0x4100,
    OBJ_LIGHT : 0x4600,
    OBJ_CAMERA : 0x4700,
    TRI_VERTEX : 0x4110,
    TRI_TEXVERTEX : 0x4140,
    TRI_FACE : 0x4120,
    TRI_TRANSFORMATION : 0x4160,
    TRI_MATERIAL : 0x4130,
    TRI_SMOOTH : 0x4150,
    KF3DS : 0xB000,
    OBJECT_NODE : 0xB002,
    OBJECT_HIERARCHY : 0xB010,
    OBJECT_INSTANCE_NAME : 0xB011,
    OBJECT_PIVOT : 0xB013,
    OBJECT_POSITION : 0xB020,
    OBJECT_ROTATION : 0xB021,
    OBJECT_SCALE : 0xB022,
    OBJECT_ID : 0xB030
};

class Importer3dsNode
{
    constructor ()
    {
        this.id = -1;
        this.name = '';
        this.flags = -1;
        this.parentId = -1;
        this.instanceName = '';
        this.pivot = [0.0, 0.0, 0.0];
        this.positions = [];
        this.rotations = [];
        this.scales = [];
    }
}

class Importer3dsNodeList
{
    constructor ()
    {
        this.nodes = [];
        this.nodeIdToNode = new Map ();
    }

    IsEmpty ()
    {
        return this.nodes.length === 0;
    }

    AddNode (node)
    {
        this.nodes.push (node);
        this.nodeIdToNode.set (node.nodeId, node);
    }

    GetNodes ()
    {
        return this.nodes;
    }
}

export class Importer3ds extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === '3ds';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    ClearContent ()
    {
        this.materialNameToIndex = null;
        this.meshNameToIndex = null;
        this.nodeList = null;
    }

    ResetContent ()
    {
        this.materialNameToIndex = new Map ();
        this.meshNameToIndex = new Map ();
        this.nodeList = new Importer3dsNodeList ();
    }

    ImportContent (fileContent, onFinish)
    {
        this.ProcessBinary (fileContent);
        onFinish ();
    }

    ProcessBinary (fileContent)
    {
        let reader = new BinaryReader (fileContent, true);
        let endByte = reader.GetByteLength ();
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.MAIN3DS) {
                this.ReadMainChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadMainChunk (reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.EDIT3DS) {
                this.ReadEditorChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.KF3DS) {
                this.ReadKeyFrameChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
        this.BuildNodeHierarchy ();
    }

    ReadEditorChunk (reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.EDIT_MATERIAL) {
                this.ReadMaterialChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.EDIT_OBJECT) {
                this.ReadObjectChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadMaterialChunk (reader, length)
    {
        let material = new PhongMaterial ();
        let endByte = this.GetChunkEnd (reader, length);
        let shininess = null;
        let shininessStrength = null;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.MAT_NAME) {
                material.name = this.ReadName (reader);
            } else if (chunkId === CHUNK3DS.MAT_AMBIENT) {
                material.ambient = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.MAT_DIFFUSE) {
                material.color = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.MAT_SPECULAR) {
                material.specular = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.MAT_SHININESS) {
                shininess = this.ReadPercentageChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.MAT_SHININESS_STRENGTH) {
                shininessStrength = this.ReadPercentageChunk (reader, chunkLength);
            } else if (chunkId === CHUNK3DS.MAT_TRANSPARENCY) {
                material.opacity = 1.0 - this.ReadPercentageChunk (reader, chunkLength);
                UpdateMaterialTransparency (material);
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP) {
                material.diffuseMap = this.ReadTextureMapChunk (reader, chunkLength);
                UpdateMaterialTransparency (material);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        if (shininess !== null && shininessStrength !== null) {
            material.shininess = shininess * shininessStrength / 10.0;
        }
        let materialIndex = this.model.AddMaterial (material);
        this.materialNameToIndex.set (material.name, materialIndex);
    }

    ReadTextureMapChunk (reader, length)
    {
        let texture = new TextureMap ();
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.MAT_TEXMAP_NAME) {
                let textureName = this.ReadName (reader);
                let textureBuffer = this.callbacks.getFileBuffer (textureName);
                texture.name = textureName;
                texture.buffer = textureBuffer;
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP_UOFFSET) {
                texture.offset.x = reader.ReadFloat32 ();
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP_VOFFSET) {
                texture.offset.y = reader.ReadFloat32 ();
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP_USCALE) {
                texture.scale.x = reader.ReadFloat32 ();
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP_VSCALE) {
                texture.scale.y = reader.ReadFloat32 ();
            } else if (chunkId === CHUNK3DS.MAT_TEXMAP_ROTATION) {
                texture.rotation = reader.ReadFloat32 () * DegRad;
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
        return texture;
    }

    ReadColorChunk (reader, length)
    {
        let color = new RGBColor (0, 0, 0);
        let endByte = this.GetChunkEnd (reader, length);
        let hasLinColor = false;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.MAT_COLOR) {
                if (!hasLinColor) {
                    color.r = reader.ReadUnsignedCharacter8 ();
                    color.g = reader.ReadUnsignedCharacter8 ();
                    color.b = reader.ReadUnsignedCharacter8 ();
                }
            } else if (chunkId === CHUNK3DS.MAT_LIN_COLOR) {
                color.r = reader.ReadUnsignedCharacter8 ();
                color.g = reader.ReadUnsignedCharacter8 ();
                color.b = reader.ReadUnsignedCharacter8 ();
                hasLinColor = true;
            } else if (chunkId === CHUNK3DS.MAT_COLOR_F) {
                if (!hasLinColor) {
                    color.r = ColorComponentFromFloat (reader.ReadFloat32 ());
                    color.g = ColorComponentFromFloat (reader.ReadFloat32 ());
                    color.b = ColorComponentFromFloat (reader.ReadFloat32 ());
                }
            } else if (chunkId === CHUNK3DS.MAT_LIN_COLOR_F) {
                color.r = ColorComponentFromFloat (reader.ReadFloat32 ());
                color.g = ColorComponentFromFloat (reader.ReadFloat32 ());
                color.b = ColorComponentFromFloat (reader.ReadFloat32 ());
                hasLinColor = true;
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
        return color;
    }

    ReadPercentageChunk (reader, length)
    {
        let percentage = 0.0;
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.PERCENTAGE) {
                percentage = reader.ReadUnsignedInteger16 () / 100.0;
            } else if (chunkId === CHUNK3DS.PERCENTAGE_F) {
                percentage = reader.ReadFloat32 ();
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
        return percentage;
    }

    ReadObjectChunk (reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        let objectName = this.ReadName (reader);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.OBJ_TRIMESH) {
                this.ReadMeshChunk (reader, chunkLength, objectName);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadMeshChunk (reader, length, objectName)
    {
        function ApplyMeshTransformation (mesh, meshMatrix)
        {
            if (!meshMatrix.IsValid ()) {
                return;
            }

            let determinant = meshMatrix.Determinant ();
            let mirrorByX = IsNegative (determinant);
            if (mirrorByX) {
                let scaleMatrix = new Matrix ().CreateScale (-1.0, 1.0, 1.0);
                meshMatrix = scaleMatrix.MultiplyMatrix (meshMatrix);
            }

            let invMeshMatrix = meshMatrix.Invert ();
            if (invMeshMatrix === null) {
                return;
            }

            let transformation = new Transformation (invMeshMatrix);
            TransformMesh (mesh, transformation);
            if (mirrorByX) {
                FlipMeshTrianglesOrientation (mesh);
            }
        }

        let mesh = new Mesh ();
        mesh.SetName (objectName);

        let endByte = this.GetChunkEnd (reader, length);
        let matrixElements = null;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.TRI_VERTEX) {
                this.ReadVerticesChunk (mesh, reader);
            } else if (chunkId === CHUNK3DS.TRI_TEXVERTEX) {
                this.ReadTextureVerticesChunk (mesh, reader);
            } else if (chunkId === CHUNK3DS.TRI_FACE) {
                this.ReadFacesChunk (mesh, reader, chunkLength);
            } else if (chunkId === CHUNK3DS.TRI_TRANSFORMATION) {
                matrixElements = this.ReadTransformationChunk (reader);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        if (mesh.VertexCount () === mesh.TextureUVCount ()) {
            for (let i = 0; i < mesh.TriangleCount (); i++) {
                let triangle = mesh.GetTriangle (i);
                triangle.SetTextureUVs (
                    triangle.v0,
                    triangle.v1,
                    triangle.v2
                );
            }
        }

        let meshMatrix = new Matrix (matrixElements);
        ApplyMeshTransformation (mesh, meshMatrix);

        let meshIndex = this.model.AddMesh (mesh);
        this.meshNameToIndex.set (mesh.GetName (), meshIndex);
    }

    ReadVerticesChunk (mesh, reader)
    {
        let vertexCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < vertexCount; i++) {
            let x = reader.ReadFloat32 ();
            let y = reader.ReadFloat32 ();
            let z = reader.ReadFloat32 ();
            mesh.AddVertex (new Coord3D (x, y, z));
        }
    }

    ReadTextureVerticesChunk (mesh, reader)
    {
        let texVertexCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < texVertexCount; i++) {
            let x = reader.ReadFloat32 ();
            let y = reader.ReadFloat32 ();
            mesh.AddTextureUV (new Coord2D (x, y));
        }
    }

    ReadFacesChunk (mesh, reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        let faceCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < faceCount; i++) {
            let v0 = reader.ReadUnsignedInteger16 ();
            let v1 = reader.ReadUnsignedInteger16 ();
            let v2 = reader.ReadUnsignedInteger16 ();
            reader.ReadUnsignedInteger16 (); // flags
            mesh.AddTriangle (new Triangle (v0, v1, v2));
        }

        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.TRI_MATERIAL) {
                this.ReadFaceMaterialsChunk (mesh, reader);
            } else if (chunkId === CHUNK3DS.TRI_SMOOTH) {
                this.ReadFaceSmoothingGroupsChunk (mesh, faceCount, reader);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadFaceMaterialsChunk (mesh, reader)
    {
        let materialName = this.ReadName (reader);
        let materialIndex = this.materialNameToIndex.get (materialName);
        let faceCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < faceCount; i++) {
            let faceIndex = reader.ReadUnsignedInteger16 ();
            let triangle = mesh.GetTriangle (faceIndex);
            if (materialIndex !== undefined) {
                triangle.mat = materialIndex;
            }
        }
    }

    ReadFaceSmoothingGroupsChunk (mesh, faceCount, reader)
    {
        for (let i = 0; i < faceCount; i++) {
            let smoothingGroup = reader.ReadUnsignedInteger32 ();
            let triangle = mesh.GetTriangle (i);
            triangle.curve = smoothingGroup;
        }
    }

    ReadTransformationChunk (reader)
    {
        let matrix = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                matrix.push (reader.ReadFloat32 ());
            }
            if (i < 3) {
                matrix.push (0);
            } else {
                matrix.push (1);
            }
        }
        return matrix;
    }

    ReadKeyFrameChunk (reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.OBJECT_NODE) {
                this.ReadObjectNodeChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    BuildNodeHierarchy ()
    {
        function GetNodeTransformation (node3ds, isMeshNode)
        {
            function GetNodePosition (node3ds)
            {
                if (node3ds.positions.length === 0) {
                    return [0.0, 0.0, 0.0];
                }
                return node3ds.positions[0];
            }

            function GetNodeRotation (node3ds)
            {
                function GetQuaternionFromAxisAndAngle (axisAngle)
                {
                    let result = [0.0, 0.0, 0.0, 1.0];
                    let length = Math.sqrt (axisAngle[0] * axisAngle[0] + axisAngle[1] * axisAngle[1] + axisAngle[2] * axisAngle[2]);
                    if (length > 0.0) {
                        let omega = axisAngle[3] * -0.5;
                        let si = Math.sin (omega) / length;
                        result = [si * axisAngle[0], si * axisAngle[1], si * axisAngle[2], Math.cos (omega)];
                    }
                    return result;
                }

                if (node3ds.rotations.length === 0) {
                    return [0.0, 0.0, 0.0, 1.0];
                }

                let rotation = node3ds.rotations[0];
                return GetQuaternionFromAxisAndAngle (rotation);
            }

            function GetNodeScale (node3ds)
            {
                if (node3ds.scales.length === 0) {
                    return [1.0, 1.0, 1.0];
                }
                return node3ds.scales[0];
            }

            let matrix = new Matrix ();
            matrix.ComposeTRS (
                ArrayToCoord3D (GetNodePosition (node3ds)),
                ArrayToQuaternion (GetNodeRotation (node3ds)),
                ArrayToCoord3D (GetNodeScale (node3ds))
            );

            if (isMeshNode) {
                let pivotPoint = node3ds.pivot;
                let pivotMatrix = new Matrix ().CreateTranslation (-pivotPoint[0], -pivotPoint[1], -pivotPoint[2]);
                matrix = pivotMatrix.MultiplyMatrix (matrix);
            }

            return new Transformation (matrix);
        }

        let rootNode = this.model.GetRootNode ();
        if (this.nodeList.IsEmpty ()) {
            for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
                rootNode.AddMeshIndex (meshIndex);
            }
        } else {
            let nodeIdToModelNode = new Map ();
            for (let node3ds of this.nodeList.GetNodes ()) {
                let node = new Node ();
                if (node3ds.name.length > 0 && node3ds.name !== '$$$DUMMY') {
                    node.SetName (node3ds.name);
                    if (node3ds.instanceName.length > 0) {
                        node.SetName (node.GetName () + ' ' + node3ds.instanceName);
                    }
                }
                if (node3ds.parentId === 65535 || !nodeIdToModelNode.has (node3ds.parentId)) {
                    rootNode.AddChildNode (node);
                } else {
                    let parentNode = nodeIdToModelNode.get (node3ds.parentId);
                    parentNode.AddChildNode (node);
                }
                nodeIdToModelNode.set (node3ds.id, node);
                let isMeshNode = this.meshNameToIndex.has (node3ds.name);
                node.SetTransformation (GetNodeTransformation (node3ds, isMeshNode));
                if (isMeshNode) {
                    node.AddMeshIndex (this.meshNameToIndex.get (node3ds.name));
                }
            }
        }
    }

    ReadObjectNodeChunk (reader, length)
    {
        function ReadTrackVector (obj, reader, type)
        {
            let result = [];
            reader.Skip (10);

            let keyNum = reader.ReadInteger32 ();
            for (let i = 0; i < keyNum; i++) {
                reader.ReadInteger32 ();
                let flags = reader.ReadUnsignedInteger16 ();
                if (flags !== 0) {
                    reader.ReadFloat32 ();
                }

                let current = null;
                if (type === CHUNK3DS.OBJECT_ROTATION) {
                    let tmp = reader.ReadFloat32 ();
                    current = obj.ReadVector (reader);
                    current[3] = tmp;
                } else {
                    current = obj.ReadVector (reader);
                }
                result.push (current);
            }

            return result;
        }

        let node3ds = new Importer3dsNode ();
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === CHUNK3DS.OBJECT_HIERARCHY) {
                node3ds.name = this.ReadName (reader);
                node3ds.flags = reader.ReadUnsignedInteger32 ();
                node3ds.parentId = reader.ReadUnsignedInteger16 ();
            } else if (chunkId === CHUNK3DS.OBJECT_INSTANCE_NAME) {
                node3ds.instanceName = this.ReadName (reader);
            } else if (chunkId === CHUNK3DS.OBJECT_PIVOT) {
                node3ds.pivot = this.ReadVector (reader);
            } else if (chunkId === CHUNK3DS.OBJECT_POSITION) {
                node3ds.positions = ReadTrackVector (this, reader, CHUNK3DS.OBJECT_POSITION);
            } else if (chunkId === CHUNK3DS.OBJECT_ROTATION) {
                node3ds.rotations = ReadTrackVector (this, reader, CHUNK3DS.OBJECT_ROTATION);
            } else if (chunkId === CHUNK3DS.OBJECT_SCALE) {
                node3ds.scales = ReadTrackVector (this, reader, CHUNK3DS.OBJECT_SCALE);
            } else if (chunkId === CHUNK3DS.OBJECT_ID) {
                node3ds.id = reader.ReadUnsignedInteger16 ();
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        this.nodeList.AddNode (node3ds);
    }

    ReadName (reader)
    {
        let name = '';
        let char = 0;
        let count = 0;
        while (count < 64) {
            char = reader.ReadCharacter8 ();
            if (char === 0) {
                break;
            }
            name = name + String.fromCharCode (char);
            count = count + 1;
        }
        return name;
    }

    ReadVector (reader)
    {
        let result = [
            reader.ReadFloat32 (),
            reader.ReadFloat32 (),
            reader.ReadFloat32 ()
        ];
        return result;
    }

    ReadChunks (reader, endByte, onChunk)
    {
        while (reader.GetPosition () <= endByte - 6) {
        let chunkId = reader.ReadUnsignedInteger16 ();
            let chunkLength = reader.ReadUnsignedInteger32 ();
            onChunk (chunkId, chunkLength);
        }
    }

    GetChunkEnd (reader, length)
    {
        return reader.GetPosition () + length - 6;
    }

    SkipChunk (reader, length)
    {
        reader.Skip (length - 6);
    }
}
