OV.GeneratorParams = class
{
    constructor ()
    {
        this.name = null;
        this.material = null;
        this.transformation = null;
    }

    SetName (name)
    {
        this.name = name;
        return this;
    }

    SetMaterial (material)
    {
        this.material = material;
        return this;
    }

    SetTransformation (translation, rotation, scale)
    {
        const matrix = new OV.Matrix ().ComposeTRS (translation, rotation, scale);
        return this.SetTransformationMatrix (matrix);
    }

    SetTransformationMatrix (matrix)
    {
        this.transformation = new OV.Transformation (matrix);
        return this;
    }
};

OV.Generator = class
{
    constructor (params)
    {
        this.params = params || new OV.GeneratorParams ();
        this.mesh = new OV.Mesh ();
        if (this.params.name !== null) {
            this.mesh.SetName (this.params.name);
        }
    }

    GetMesh ()
    {
        return this.mesh;
    }

    AddVertex (x, y, z)
    {
        let coord = new OV.Coord3D (x, y, z);
        if (this.params.transformation !== null) {
            coord = this.params.transformation.TransformCoord3D (coord);
        }
        return this.mesh.AddVertex (coord);
    }

    AddTriangle (v0, v1, v2)
    {
        let triangle = new OV.Triangle (v0, v1, v2);
        if (this.params.material !== null) {
            triangle.SetMaterial (this.params.material);
        }
        return this.mesh.AddTriangle (triangle);
    }

    AddConvexPolygon (vertices)
    {
        for (let vertexIndex = 0; vertexIndex < vertices.length - 2; vertexIndex++) {
            this.AddTriangle (
                vertices[0],
                vertices[vertexIndex + 1],
                vertices[vertexIndex + 2]
            );
        }
    }
};


OV.GenerateExtrude = function (genParams, vertices, height)
{
	let generator = new OV.Generator (genParams);

    let topPolygon = [];
    let bottomPolygon = [];
    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];
        generator.AddVertex (vertex.x, vertex.y, 0.0);
        generator.AddVertex (vertex.x, vertex.y, height);
        topPolygon.push (i * 2 + 1);
        bottomPolygon.push (2 * vertices.length - (i + 1) * 2);
    }

    for (let i = 0; i < vertices.length; i++) {
        const bottom = i * 2;
        const bottomNext = (i < vertices.length - 1) ? bottom + 2 : 0;
        const top = i * 2 + 1;
        const topNext = (i < vertices.length - 1) ? top + 2 : 1;
        generator.AddConvexPolygon ([
            bottom,
            bottomNext,
            topNext,
            top
        ]);
    }

    generator.AddConvexPolygon (bottomPolygon);
    generator.AddConvexPolygon (topPolygon);
    return generator.GetMesh ();
};

OV.GenerateCuboid = function (genParams, xSize, ySize, zSize)
{
    let vertices = [
        new OV.Coord2D (0.0, 0.0),
        new OV.Coord2D (xSize, 0.0),
        new OV.Coord2D (xSize, ySize),
        new OV.Coord2D (0.0, ySize),
    ];
    return OV.GenerateExtrude (genParams, vertices, zSize);
};

OV.GenerateCylinder = function (genParams, radius, height, segments)
{
    function GetCylindricalCoord (radius, angle)
    {
        return new OV.Coord2D (
            radius * Math.cos (angle),
            radius * Math.sin (angle)
        );
    }

    let baseVertices = [];
	const step = 2.0 * Math.PI / segments;
	for (let i = 0; i < segments; i++) {
        let cylindrical = GetCylindricalCoord (radius, i * step);
		baseVertices.push (cylindrical);
	}
    return OV.GenerateExtrude (genParams, baseVertices, height);
};
