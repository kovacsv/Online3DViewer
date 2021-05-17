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

OV.GetTriangleSignedVolume = function (v0, v1, v2)
{
    return OV.DotVector3D (v0, OV.CrossVector3D (v1, v2)) / 6.0;
};

OV.CalculateModelVolume = function (model)
{
    if (!OV.IsModelSolid (model)) {
        return null;
    }
    let volume = 0.0;
    OV.EnumerateModelTriangles (model, function (v0, v1, v2) {
        volume += OV.GetTriangleSignedVolume (v0, v1, v2);
    });
    return volume;
};

OV.CalculateModelSurfaceArea = function (model)
{
    let surface = 0.0;
    OV.EnumerateModelTriangles (model, function (v0, v1, v2) {
        surface += OV.GetTriangleArea (v0, v1, v2);
    });
    return surface;
};
