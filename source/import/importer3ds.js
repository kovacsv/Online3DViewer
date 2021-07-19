OV.CHUNK3DS =
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

OV.Importer3ds = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === '3ds';
    }

    GetKnownFileFormats ()
    {
        return {
            '3ds' : OV.FileFormat.Binary
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.Z;
    }    

    ClearContent ()
    {
        this.materialNameToIndex = null;
        this.meshNameToIndex = null;
    
        this.meshTransformations = null;
        this.defaultMaterialIndex = null;
    }

    ResetContent ()
    {
        this.materialNameToIndex = {};
        this.meshNameToIndex = {};

        this.meshTransformations = [];
        this.defaultMaterialIndex = null;
    }

    ImportContent (fileContent, onFinish)
    {
        this.ProcessBinary (fileContent);
        onFinish ();
    }

    ProcessBinary (fileContent)
    {
        let reader = new OV.BinaryReader (fileContent, true);
        let endByte = reader.GetByteLength ();
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.MAIN3DS) {
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
            if (chunkId === OV.CHUNK3DS.EDIT3DS) {
                this.ReadEditorChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.KF3DS) {
                this.ReadKeyFrameChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadEditorChunk (reader, length)
    {
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.EDIT_MATERIAL) {
                this.ReadMaterialChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.EDIT_OBJECT) {
                this.ReadObjectChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadMaterialChunk (reader, length)
    {
        let material = new OV.Material (OV.MaterialType.Phong);
        let endByte = this.GetChunkEnd (reader, length);
        let shininess = null;
        let shininessStrength = null;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.MAT_NAME) {
                material.name = this.ReadName (reader);
            } else if (chunkId === OV.CHUNK3DS.MAT_AMBIENT) {
                material.ambient = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.MAT_DIFFUSE) {
                material.color = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.MAT_SPECULAR) {
                material.specular = this.ReadColorChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.MAT_SHININESS) {
                shininess = this.ReadPercentageChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.MAT_SHININESS_STRENGTH) {
                shininessStrength = this.ReadPercentageChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.MAT_TRANSPARENCY) {
                material.opacity = 1.0 - this.ReadPercentageChunk (reader, chunkLength);
                OV.UpdateMaterialTransparency (material);
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP) {
                material.diffuseMap = this.ReadTextureMapChunk (reader, chunkLength);
                OV.UpdateMaterialTransparency (material);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        if (shininess !== null && shininessStrength !== null) {
            material.shininess = shininess * shininessStrength / 10.0;
        }
        let materialIndex = this.model.AddMaterial (material);
        this.materialNameToIndex[material.name] = materialIndex;
    }

    ReadTextureMapChunk (reader, length)
    {
        let texture = new OV.TextureMap ();
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_NAME) {
                let textureName = this.ReadName (reader);
                let textureBuffer = this.callbacks.getTextureBuffer (textureName);
                texture.name = textureName;
                if (textureBuffer !== null) {
                    texture.url = textureBuffer.url;
                    texture.buffer = textureBuffer.buffer;
                }
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_UOFFSET) {
                texture.offset.x = reader.ReadFloat32 ();
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_VOFFSET) {
                texture.offset.y = reader.ReadFloat32 ();
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_USCALE) {
                texture.scale.x = reader.ReadFloat32 ();
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_VSCALE) {
                texture.scale.y = reader.ReadFloat32 ();
            } else if (chunkId === OV.CHUNK3DS.MAT_TEXMAP_ROTATION) {
                texture.rotation = reader.ReadFloat32 () * OV.DegRad;
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
        return texture;
    }    

    ReadColorChunk (reader, length)
    {
        let color = new OV.Color (0, 0, 0);
        let endByte = this.GetChunkEnd (reader, length);
        let hasLinColor = false;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.MAT_COLOR) {
                if (!hasLinColor) {
                    color.r = reader.ReadUnsignedCharacter8 ();
                    color.g = reader.ReadUnsignedCharacter8 ();
                    color.b = reader.ReadUnsignedCharacter8 ();
                }
            } else if (chunkId === OV.CHUNK3DS.MAT_LIN_COLOR) {
                color.r = reader.ReadUnsignedCharacter8 ();
                color.g = reader.ReadUnsignedCharacter8 ();
                color.b = reader.ReadUnsignedCharacter8 ();
                hasLinColor = true;
            } else if (chunkId === OV.CHUNK3DS.MAT_COLOR_F) {
                if (!hasLinColor) {
                    color.r = parseInt (reader.ReadFloat32 () * 255.0, 10);
                    color.g = parseInt (reader.ReadFloat32 () * 255.0, 10);
                    color.b = parseInt (reader.ReadFloat32 () * 255.0, 10);
                }
            } else if (chunkId === OV.CHUNK3DS.MAT_LIN_COLOR_F) {
                color.r = parseInt (reader.ReadFloat32 () * 255.0, 10);
                color.g = parseInt (reader.ReadFloat32 () * 255.0, 10);
                color.b = parseInt (reader.ReadFloat32 () * 255.0, 10);
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
            if (chunkId === OV.CHUNK3DS.PERCENTAGE) {
                percentage = reader.ReadUnsignedInteger16 () / 100.0;
            } else if (chunkId === OV.CHUNK3DS.PERCENTAGE_F) {
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
            if (chunkId === OV.CHUNK3DS.OBJ_TRIMESH) {
                this.ReadMeshChunk (reader, chunkLength, objectName);
            } else if (chunkId === OV.CHUNK3DS.OBJ_LIGHT) {
                this.SkipChunk (reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.OBJ_CAMERA) {
                this.SkipChunk (reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadMeshChunk (reader, length, objectName)
    {
        let mesh = new OV.Mesh ();
        mesh.SetName (objectName);

        let endByte = this.GetChunkEnd (reader, length);
        let transformation = null;
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.TRI_VERTEX) {
                this.ReadVerticesChunk (mesh, reader);
            } else if (chunkId === OV.CHUNK3DS.TRI_TEXVERTEX) {
                this.ReadTextureVerticesChunk (mesh, reader);
            } else if (chunkId === OV.CHUNK3DS.TRI_FACE) {
                this.ReadFacesChunk (mesh, reader, chunkLength);
            } else if (chunkId === OV.CHUNK3DS.TRI_TRANSFORMATION) {
                transformation = this.ReadTransformationChunk (reader);
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

        let meshIndex = this.model.AddMesh (mesh);
        this.meshNameToIndex[mesh.GetName ()] = meshIndex;
        this.meshTransformations.push (new OV.Matrix (transformation));
    }

    ReadVerticesChunk (mesh, reader)
    {
        let vertexCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < vertexCount; i++) {
            let x = reader.ReadFloat32 ();
            let y = reader.ReadFloat32 ();
            let z = reader.ReadFloat32 ();
            mesh.AddVertex (new OV.Coord3D (x, y, z));
        }
    }

    ReadTextureVerticesChunk (mesh, reader)
    {
        let texVertexCount = reader.ReadUnsignedInteger16 ();
        for (let i = 0; i < texVertexCount; i++) {
            let x = reader.ReadFloat32 ();
            let y = reader.ReadFloat32 ();
            mesh.AddTextureUV (new OV.Coord2D (x, y));
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
            mesh.AddTriangle (new OV.Triangle (v0, v1, v2));
        }

        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.TRI_MATERIAL) {
                this.ReadFaceMaterialsChunk (mesh, reader);
            } else if (chunkId === OV.CHUNK3DS.TRI_SMOOTH) {
                this.ReadFaceSmoothingGroupsChunk (mesh, faceCount, reader);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });
    }

    ReadFaceMaterialsChunk (mesh, reader)
    {
        let materialName = this.ReadName (reader);
        let materialIndex = this.materialNameToIndex[materialName];
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
        let nodeHierarchy = {
            nodes : [],
            idToIndex : {},
            meshIndexToNodes : {}
        };

        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.OBJECT_NODE) {
                this.ReadObjectNodeChunk (nodeHierarchy, reader, chunkLength);
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        this.ApplyModelTransformations (nodeHierarchy);
    }

    ApplyModelTransformations (nodeHierarchy)
    {
        function GetNodeTransformation (nodeHierarchy, node)
        {
            function GetNodePosition (node)
            {
                if (node.positions.length === 0) {
                    return [0.0, 0.0, 0.0];
                }
                return node.positions[0];
            }
        
            function GetNodeRotation (node)
            {
                function GetQuaternionFromAxisAndAngle (rotation)
                {
                    let result = [0.0, 0.0, 0.0, 1.0];
                    let length = Math.sqrt (rotation[0] * rotation[0] + rotation[1] * rotation[1] + rotation[2] * rotation[2]);
                    if (length > 0.0) {
                        let omega = rotation[3] * -0.5;
                        let si = Math.sin (omega) / length;
                        result = [si * rotation[0], si * rotation[1], si * rotation[2], Math.cos (omega)];
                    }
                    return result;
                }

                if (node.rotations.length === 0) {
                    return [0.0, 0.0, 0.0, 1.0];
                }
                
                let rotation = node.rotations[0];
                return GetQuaternionFromAxisAndAngle (rotation);
            }

            function GetNodeScale (node)
            {
                if (node.scales.length === 0) {
                    return [1.0, 1.0, 1.0];
                }
                return node.scales[0];
            }
            
            if (node.matrix !== null) {
                return node.matrix;
            }
            
            let matrix = new OV.Matrix ();
            matrix.ComposeTRS (
                OV.ArrayToCoord3D (GetNodePosition (node)),
                OV.ArrayToQuaternion (GetNodeRotation (node)),
                OV.ArrayToCoord3D (GetNodeScale (node))
            );

            if (node.userId !== 65535) {
                let parentIndex = nodeHierarchy.idToIndex[node.userId];
                if (parentIndex !== undefined) {
                    let parentNode = nodeHierarchy.nodes[parentIndex];
                    let parentMatrix = GetNodeTransformation (nodeHierarchy, parentNode);
                    matrix = matrix.MultiplyMatrix (parentMatrix);
                }
            }
            
            node.matrix = matrix;
            return matrix;
        }

        function ApplyMeshTransformation (model, currentMeshIndex, meshMatrix, nodeHierarchy, node)
        {
            function GetNodePivotPoint (node)
            {
                if (node === null) {
                    return [0.0, 0.0, 0.0];
                }
                return node.pivot;
            }

            if (!meshMatrix.IsValid ()) {
                return;
            }

            let nodeMatrix = meshMatrix;
            if (node !== null) {
                nodeMatrix = GetNodeTransformation (nodeHierarchy, node);
            }

            let mesh = model.GetMesh (currentMeshIndex);
            let determinant = meshMatrix.Determinant ();
            let mirrorByX = OV.IsNegative (determinant);
            if (mirrorByX) {
                // Mirror by x coordinates
                let scaleMatrix = new OV.Matrix ().CreateScale (-1.0, 1.0, 1.0);
                meshMatrix = scaleMatrix.MultiplyMatrix (meshMatrix);
            }

            let invMeshMatrix = meshMatrix.Invert ();
            if (invMeshMatrix === null) {
                return;
            }
            
            let pivotPoint = GetNodePivotPoint (node);
            let pivotMatrix = new OV.Matrix ().CreateTranslation (-pivotPoint[0], -pivotPoint[1], -pivotPoint[2]);

            let matrix = nodeMatrix.Clone ();
            matrix = pivotMatrix.MultiplyMatrix (matrix);
            matrix = invMeshMatrix.MultiplyMatrix (matrix);

            let transformation = new OV.Transformation (matrix);
            if (mirrorByX) {
                OV.FlipMeshTrianglesOrientation (mesh);
            }
            OV.TransformMesh (mesh, transformation);
        }

        function AddDuplicatedMesh (model, meshIndex, toIndex)
        {
            let mesh = model.GetMesh (meshIndex);
            let clonedMesh = OV.CloneMesh (mesh);
            let clonedMeshIndex = model.AddMeshToIndex (clonedMesh, toIndex);
            return clonedMeshIndex;
        }

        let newToOldMeshIndexOffset = 0;
        for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
            let currentMeshIndex = meshIndex;
            let originalMeshIndex = currentMeshIndex - newToOldMeshIndexOffset;
            let meshTransformation = this.meshTransformations[originalMeshIndex];
            let meshNodes = nodeHierarchy.meshIndexToNodes[originalMeshIndex];
            if (meshNodes === undefined) {
                ApplyMeshTransformation (this.model, currentMeshIndex, meshTransformation, nodeHierarchy, null);
            } else {
                for (let nodeIndex = 0; nodeIndex < meshNodes.length; nodeIndex++) {
                    let currentNode = meshNodes[nodeIndex];
                    let transformedMeshIndex = currentMeshIndex;
                    if (nodeIndex > 0) {
                        transformedMeshIndex = AddDuplicatedMesh (this.model, currentMeshIndex, currentMeshIndex + nodeIndex);
                        newToOldMeshIndexOffset += 1;
                        meshIndex += 1;
                    }
                    ApplyMeshTransformation (this.model, transformedMeshIndex, meshTransformation, nodeHierarchy, currentNode);
                }
            }
        }
    }

    ReadObjectNodeChunk (nodeHierarchy, reader, length)
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
                if (type === OV.CHUNK3DS.OBJECT_ROTATION) {
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
    
        let objectNode = {
            name : '',
            instanceName : '',
            nodeId : -1,
            flags : -1,
            userId : -1,
            pivot : [0.0, 0.0, 0.0],
            positions : [],
            rotations : [],
            scales : [],
            matrix : null
        };
        
        let endByte = this.GetChunkEnd (reader, length);
        this.ReadChunks (reader, endByte, (chunkId, chunkLength) => {
            if (chunkId === OV.CHUNK3DS.OBJECT_HIERARCHY) {
                objectNode.name = this.ReadName (reader);
                objectNode.flags = reader.ReadUnsignedInteger32 ();
                objectNode.userId = reader.ReadUnsignedInteger16 ();
            } else if (chunkId === OV.CHUNK3DS.OBJECT_INSTANCE_NAME) {
                objectNode.instanceName = this.ReadName (reader);
            } else if (chunkId === OV.CHUNK3DS.OBJECT_PIVOT) {
                objectNode.pivot = this.ReadVector (reader);
            } else if (chunkId === OV.CHUNK3DS.OBJECT_POSITION) {
                objectNode.positions = ReadTrackVector (this, reader, OV.CHUNK3DS.OBJECT_POSITION);
            } else if (chunkId === OV.CHUNK3DS.OBJECT_ROTATION) {
                objectNode.rotations = ReadTrackVector (this, reader, OV.CHUNK3DS.OBJECT_ROTATION);
            } else if (chunkId === OV.CHUNK3DS.OBJECT_SCALE) {
                objectNode.scales = ReadTrackVector (this, reader, OV.CHUNK3DS.OBJECT_SCALE);
            } else if (chunkId === OV.CHUNK3DS.OBJECT_ID) {
                objectNode.nodeId = reader.ReadUnsignedInteger16 ();
            } else {
                this.SkipChunk (reader, chunkLength);
            }
        });

        let nodeIndex = nodeHierarchy.nodes.length;
        nodeHierarchy.nodes.push (objectNode);
        nodeHierarchy.idToIndex[objectNode.nodeId] = nodeIndex;

        let meshIndex = this.meshNameToIndex[objectNode.name];
        if (meshIndex !== undefined) {
            let meshNodes = nodeHierarchy.meshIndexToNodes[meshIndex];
            if (meshNodes === undefined) {
                nodeHierarchy.meshIndexToNodes[meshIndex] = [];
            }
            nodeHierarchy.meshIndexToNodes[meshIndex].push (objectNode);
        }
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
};
