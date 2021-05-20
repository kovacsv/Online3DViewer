OV.GetTriangleArea = function (v0, v1, v2)
{
    const a = OV.CoordDistance3D (v0, v1);
    const b = OV.CoordDistance3D (v1, v2);
    const c = OV.CoordDistance3D (v0, v2);
    const s = (a + b + c) / 2.0;
    const areaSquare = s * (s - a) * (s - b) * (s - c);
    if (areaSquare < 0.0) {
        return 0.0;
    }
    return Math.sqrt (areaSquare);
};

OV.GetTetrahedronSignedVolume = function (v0, v1, v2)
{
    return OV.DotVector3D (v0, OV.CrossVector3D (v1, v2)) / 6.0;
};

OV.CalculateVolume = function (enumerator)
{
    if (!OV.IsSolid (enumerator)) {
        return null;
    }
    let volume = 0.0;
    enumerator.EnumerateTriangles (function (v0, v1, v2) {
        volume += OV.GetTetrahedronSignedVolume (v0, v1, v2);
    });
    return volume;
};

OV.CalculateMeshVolume = function (mesh)
{
    let enumerator = new OV.MeshEnumerator (mesh);
    return OV.CalculateVolume (enumerator);
};

OV.CalculateModelVolume = function (model)
{
    let enumerator = new OV.ModelEnumerator (model);
    return OV.CalculateVolume (enumerator);
};

OV.CalculateSurfaceArea = function (enumerator)
{
    let surface = 0.0;
    enumerator.EnumerateTriangles (function (v0, v1, v2) {
        surface += OV.GetTriangleArea (v0, v1, v2);
    });
    return surface;
};

OV.CalculateMeshSurfaceArea = function (mesh)
{
    let enumerator = new OV.MeshEnumerator (mesh);
    return OV.CalculateSurfaceArea (enumerator);
};

OV.CalculateModelSurfaceArea = function (model)
{
    let enumerator = new OV.ModelEnumerator (model);
    return OV.CalculateSurfaceArea (enumerator);
};
