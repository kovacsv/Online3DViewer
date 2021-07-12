OV.MeshPrimitiveBuffer = class
{
    constructor ()
    {
        this.indices = [];
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.material = null;
    }

    GetBounds ()
    {
        let min = [Infinity, Infinity, Infinity];
        let max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < this.vertices.length / 3; i++) {
            for (let j = 0; j < 3; j++) {
                min[j] = Math.min (min[j], this.vertices[i * 3 + j]);
                max[j] = Math.max (max[j], this.vertices[i * 3 + j]);
            }
        }
        return {
            min : min,
            max : max
        };
    }

    GetByteLength (indexTypeSize, numberTypeSize)
    {
        let indexCount = this.indices.length;
        let numberCount = this.vertices.length + this.normals.length + this.uvs.length;
        return indexCount * indexTypeSize + numberCount * numberTypeSize;
    }
};

OV.MeshBuffer = class
{
    constructor ()
    {
        this.primitives = [];
    }

    PrimitiveCount ()
    {
        return this.primitives.length;
    }

    GetPrimitive (index)
    {
        return this.primitives[index];
    }

    GetByteLength (indexTypeSize, numberTypeSize)
    {
        let byteLength = 0;
        for (let i = 0; i < this.primitives.length; i++) {
            let primitive = this.primitives[i];
            byteLength += primitive.GetByteLength (indexTypeSize, numberTypeSize);
        }
        return byteLength;
    }    
};

OV.ConvertMeshToMeshBuffer = function (mesh)
{
    function AddVertexToPrimitiveBuffer (mesh, vertexIndex, normalIndex, uvIndex, primitiveBuffer, meshToPrimitiveVertices)
    {
        function GetUVOrDefault (mesh, uvIndex, forceUVs)
        {
            if (uvIndex !== null) {
                return mesh.GetTextureUV (uvIndex);
            } else if (forceUVs) {
                return new OV.Coord2D (0.0, 0.0);
            } else {
                return null;
            }
        }

        function AddVertex (mesh, vertexIndex, normalIndex, uvIndex, primitiveBuffer)
        {
            let forceUVs = mesh.TextureUVCount () > 0;
            let vertex = mesh.GetVertex (vertexIndex);
            let normal = mesh.GetNormal (normalIndex);
            let primitiveVertexIndex = primitiveBuffer.vertices.length / 3;
            primitiveBuffer.indices.push (primitiveVertexIndex);
            primitiveBuffer.vertices.push (vertex.x, vertex.y, vertex.z);
            primitiveBuffer.normals.push (normal.x, normal.y, normal.z);
            let uv = GetUVOrDefault (mesh, uvIndex, forceUVs);
            if (uv !== null) {
                primitiveBuffer.uvs.push (uv.x, uv.y);
            }
            return {
                index : primitiveVertexIndex,
                normal : normal,
                uv : uv
            };
        }
        
        function FindMatchingPrimitiveVertex (mesh, primitiveVertices, normalIndex, uvIndex)
        {
            for (let i = 0; i < primitiveVertices.length; i++) {
                let primitiveVertex = primitiveVertices[i];
                let normal = mesh.GetNormal (normalIndex);
                let equalNormal = OV.CoordIsEqual3D (primitiveVertex.normal, normal);
                let equalUv = false;
                if (primitiveVertex.uv === null && uvIndex === null) {
                    equalUv = true;
                } else {
                    let uv = GetUVOrDefault (mesh, uvIndex, true);
                    equalUv = OV.CoordIsEqual2D (primitiveVertex.uv, uv);
                }
                if (equalNormal && equalUv) {
                    return primitiveVertex;
                }
            }            
            return null;
        }

        let primitiveVertices = meshToPrimitiveVertices[vertexIndex];
        if (primitiveVertices === undefined) {
            let primitiveVertex = AddVertex (mesh, vertexIndex, normalIndex, uvIndex, primitiveBuffer);
            meshToPrimitiveVertices[vertexIndex] = [primitiveVertex];
        } else {
            let existingPrimitiveVertex = FindMatchingPrimitiveVertex (mesh, primitiveVertices, normalIndex, uvIndex);
            if (existingPrimitiveVertex !== null) {
                primitiveBuffer.indices.push (existingPrimitiveVertex.index);
            } else {
                let primitiveVertex = AddVertex (mesh, vertexIndex, normalIndex, uvIndex, primitiveBuffer);
                primitiveVertices.push (primitiveVertex);
            }
        }
    }

    let meshBuffer = new OV.MeshBuffer ();

    let triangleCount = mesh.TriangleCount ();
    if (triangleCount === 0) {
        return null;
    }

    let triangleIndices = [];
    for (let i = 0; i < triangleCount; i++) {
        triangleIndices.push (i);
    }
    triangleIndices.sort ((a, b) => {
        let aTriangle = mesh.GetTriangle (a);
        let bTriangle = mesh.GetTriangle (b);
        return aTriangle.mat - bTriangle.mat;
    });

    let primitiveBuffer = null;
    let meshToPrimitiveVertices = null;
    for (let i = 0; i < triangleIndices.length; i++) {
        let triangleIndex = triangleIndices[i];
        let triangle = mesh.GetTriangle (triangleIndex);
        if (primitiveBuffer === null || primitiveBuffer.material !== triangle.mat) {
            primitiveBuffer = new OV.MeshPrimitiveBuffer ();
            primitiveBuffer.material = triangle.mat;
            meshToPrimitiveVertices = {};
            meshBuffer.primitives.push (primitiveBuffer);
        }
        AddVertexToPrimitiveBuffer (mesh, triangle.v0, triangle.n0, triangle.u0, primitiveBuffer, meshToPrimitiveVertices);
        AddVertexToPrimitiveBuffer (mesh, triangle.v1, triangle.n1, triangle.u1, primitiveBuffer, meshToPrimitiveVertices);
        AddVertexToPrimitiveBuffer (mesh, triangle.v2, triangle.n2, triangle.u2, primitiveBuffer, meshToPrimitiveVertices);
    }

    return meshBuffer;
};
