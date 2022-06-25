import { Coord2D, CoordIsEqual2D } from '../geometry/coord2d.js';
import { CoordIsEqual3D } from '../geometry/coord3d.js';
import { RGBColor, RGBColorIsEqual } from './color.js';

export class MeshPrimitiveBuffer
{
    constructor ()
    {
        this.indices = [];
        this.vertices = [];
        this.colors = [];
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
        let numberCount = this.vertices.length + this.colors.length + this.normals.length + this.uvs.length;
        return indexCount * indexTypeSize + numberCount * numberTypeSize;
    }
}

export class MeshBuffer
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
}

export function ConvertMeshToMeshBuffer (mesh)
{
    function AddVertexToPrimitiveBuffer (mesh, indices, primitiveBuffer, meshVertexToPrimitiveVertices)
    {
        function GetColorOrDefault (mesh, colorIndex, forceColors)
        {
            if (colorIndex !== null) {
                return mesh.GetVertexColor (colorIndex);
            } else if (forceColors) {
                return new RGBColor (0, 0, 0);
            } else {
                return null;
            }
        }

        function GetUVOrDefault (mesh, uvIndex, forceUVs)
        {
            if (uvIndex !== null) {
                return mesh.GetTextureUV (uvIndex);
            } else if (forceUVs) {
                return new Coord2D (0.0, 0.0);
            } else {
                return null;
            }
        }

        function AddVertex (mesh, indices, primitiveBuffer)
        {
            let forceColors = mesh.VertexColorCount () > 0;
            let forceUVs = mesh.TextureUVCount () > 0;

            let vertex = mesh.GetVertex (indices.vertex);
            let normal = mesh.GetNormal (indices.normal);

            let primitiveVertexIndex = primitiveBuffer.vertices.length / 3;
            primitiveBuffer.indices.push (primitiveVertexIndex);
            primitiveBuffer.vertices.push (vertex.x, vertex.y, vertex.z);

            let color = GetColorOrDefault (mesh, indices.color, forceColors);
            if (color !== null) {
                primitiveBuffer.colors.push (color.r / 255.0, color.g / 255.0, color.b / 255.0);
            }

            primitiveBuffer.normals.push (normal.x, normal.y, normal.z);

            let uv = GetUVOrDefault (mesh, indices.uv, forceUVs);
            if (uv !== null) {
                primitiveBuffer.uvs.push (uv.x, uv.y);
            }

            return {
                index : primitiveVertexIndex,
                color : color,
                normal : normal,
                uv : uv
            };
        }

        function FindMatchingPrimitiveVertex (mesh, primitiveVertices, indices)
        {
            function IsEqualColor (mesh, colorIndex, existingColor)
            {
                if (existingColor === null && colorIndex === null) {
                    return true;
                }
                let color = GetColorOrDefault (mesh, colorIndex, true);
                return RGBColorIsEqual (existingColor, color);
            }

            function IsEqualNormal (mesh, normalIndex, existingNormal)
            {
                let normal = mesh.GetNormal (normalIndex);
                return CoordIsEqual3D (existingNormal, normal);
            }

            function IsEqualUV (mesh, uvIndex, existingUv)
            {
                if (existingUv === null && uvIndex === null) {
                    return true;
                }
                let uv = GetUVOrDefault (mesh, uvIndex, true);
                return CoordIsEqual2D (existingUv, uv);
            }

            for (let i = 0; i < primitiveVertices.length; i++) {
                let primitiveVertex = primitiveVertices[i];
                let equalColor = IsEqualColor (mesh, indices.color, primitiveVertex.color);
                let equalNormal = IsEqualNormal (mesh, indices.normal, primitiveVertex.normal);
                let equalUv = IsEqualUV (mesh, indices.uv, primitiveVertex.uv);
                if (equalColor && equalNormal && equalUv) {
                    return primitiveVertex;
                }
            }
            return null;
        }

        if (meshVertexToPrimitiveVertices.has (indices.vertex)) {
            let primitiveVertices = meshVertexToPrimitiveVertices.get (indices.vertex);
            let existingPrimitiveVertex = FindMatchingPrimitiveVertex (mesh, primitiveVertices, indices);
            if (existingPrimitiveVertex !== null) {
                primitiveBuffer.indices.push (existingPrimitiveVertex.index);
            } else {
                let primitiveVertex = AddVertex (mesh, indices, primitiveBuffer);
                primitiveVertices.push (primitiveVertex);
            }
        } else {
            let primitiveVertex = AddVertex (mesh, indices, primitiveBuffer);
            meshVertexToPrimitiveVertices.set (indices.vertex, [primitiveVertex]);
        }
    }

    let meshBuffer = new MeshBuffer ();

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
    let meshVertexToPrimitiveVertices = null;
    for (let i = 0; i < triangleIndices.length; i++) {
        let triangleIndex = triangleIndices[i];
        let triangle = mesh.GetTriangle (triangleIndex);
        if (primitiveBuffer === null || primitiveBuffer.material !== triangle.mat) {
            primitiveBuffer = new MeshPrimitiveBuffer ();
            primitiveBuffer.material = triangle.mat;
            meshVertexToPrimitiveVertices = new Map ();
            meshBuffer.primitives.push (primitiveBuffer);
        }
        let v0Indices = {
            vertex : triangle.v0,
            color : triangle.c0,
            normal : triangle.n0,
            uv : triangle.u0
        };
        let v1Indices = {
            vertex : triangle.v1,
            color : triangle.c1,
            normal : triangle.n1,
            uv : triangle.u1
        };
        let v2Indices = {
            vertex : triangle.v2,
            color : triangle.c2,
            normal : triangle.n2,
            uv : triangle.u2
        };

        AddVertexToPrimitiveBuffer (mesh, v0Indices, primitiveBuffer, meshVertexToPrimitiveVertices);
        AddVertexToPrimitiveBuffer (mesh, v1Indices, primitiveBuffer, meshVertexToPrimitiveVertices);
        AddVertexToPrimitiveBuffer (mesh, v2Indices, primitiveBuffer, meshVertexToPrimitiveVertices);
    }

    return meshBuffer;
}
