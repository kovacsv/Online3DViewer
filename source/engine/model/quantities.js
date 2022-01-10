import { CoordDistance3D, CrossVector3D, DotVector3D } from '../geometry/coord3d.js';

export function GetTriangleArea (v0, v1, v2)
{
    const a = CoordDistance3D (v0, v1);
    const b = CoordDistance3D (v1, v2);
    const c = CoordDistance3D (v0, v2);
    const s = (a + b + c) / 2.0;
    const areaSquare = s * (s - a) * (s - b) * (s - c);
    if (areaSquare < 0.0) {
        return 0.0;
    }
    return Math.sqrt (areaSquare);
}

export function GetTetrahedronSignedVolume (v0, v1, v2)
{
    return DotVector3D (v0, CrossVector3D (v1, v2)) / 6.0;
}

export function CalculateVolume (object3D)
{
    let volume = 0.0;
    object3D.EnumerateTriangleVertices ((v0, v1, v2) => {
        volume += GetTetrahedronSignedVolume (v0, v1, v2);
    });
    return volume;
}

export function CalculateSurfaceArea (object3D)
{
    let surface = 0.0;
    object3D.EnumerateTriangleVertices ((v0, v1, v2) => {
        surface += GetTriangleArea (v0, v1, v2);
    });
    return surface;
}
