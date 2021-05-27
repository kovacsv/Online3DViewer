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

OV.GenerateCuboid = function (genParams, xSize, ySize, zSize)
{
	let generator = new OV.Generator (genParams);

	generator.AddVertex (0.0, 0.0, 0.0);
	generator.AddVertex (xSize, 0.0, 0.0);
	generator.AddVertex (xSize, ySize, 0.0);
	generator.AddVertex (0.0, ySize, 0.0);
	generator.AddVertex (0.0, 0.0, zSize);
	generator.AddVertex (xSize, 0.0, zSize);
	generator.AddVertex (xSize, ySize, zSize);
	generator.AddVertex (0.0, ySize, zSize);

    generator.AddConvexPolygon ([0, 3, 2, 1]);
    generator.AddConvexPolygon ([0, 1, 5, 4]);
    generator.AddConvexPolygon ([1, 2, 6, 5]);
    generator.AddConvexPolygon ([2, 3, 7, 6]);
    generator.AddConvexPolygon ([3, 0, 4, 7]);
    generator.AddConvexPolygon ([4, 5, 6, 7]);

    return generator.GetMesh ();
};
