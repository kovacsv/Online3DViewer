import { Coord2D } from '../geometry/coord2d.js';
import { Coord3D } from '../geometry/coord3d.js';
import { IsZero } from '../geometry/geometry.js';
import { Mesh } from './mesh.js';
import { Triangle } from './triangle.js';

export class GeneratorParams
{
    constructor ()
    {
        this.name = null;
        this.material = null;
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
}

export class Generator
{
    constructor (params)
    {
        this.params = params || new GeneratorParams ();
        this.mesh = new Mesh ();
        if (this.params.name !== null) {
            this.mesh.SetName (this.params.name);
        }
        this.curve = null;
    }

    GetMesh ()
    {
        return this.mesh;
    }

    AddVertex (x, y, z)
    {
        let coord = new Coord3D (x, y, z);
        return this.mesh.AddVertex (coord);
    }

    AddVertices (vertices)
    {
        let indices = [];
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];
            indices.push (this.AddVertex (vertex.x, vertex.y, vertex.z));
        }
        return indices;
    }

    SetCurve (curve)
    {
        this.curve = curve;
    }

    ResetCurve ()
    {
        this.curve = null;
    }

    AddTriangle (v0, v1, v2)
    {
        let triangle = new Triangle (v0, v1, v2);
        if (this.params.material !== null) {
            triangle.mat = this.params.material;
        }
        if (this.curve !== null) {
            triangle.SetCurve (this.curve);
        }
        return this.mesh.AddTriangle (triangle);
    }

    AddTriangleInverted (v0, v1, v2)
    {
        this.AddTriangle (v0, v2, v1);
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

    AddConvexPolygonInverted (vertices)
    {
        for (let vertexIndex = 0; vertexIndex < vertices.length - 2; vertexIndex++) {
            this.AddTriangleInverted (
                vertices[0],
                vertices[vertexIndex + 1],
                vertices[vertexIndex + 2]
            );
        }
    }
}

export class GeneratorHelper
{
    constructor (generator)
    {
        this.generator = generator;
    }

    GenerateExtrude (vertices, height, curve)
    {
        let topPolygon = [];
        let bottomPolygon = [];
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            bottomPolygon.push (this.generator.AddVertex (vertex.x, vertex.y, 0.0));
            topPolygon.push (this.generator.AddVertex (vertex.x, vertex.y, height));
        }
        this.generator.SetCurve (curve);
        this.GenerateSurfaceBetweenPolygons (bottomPolygon, topPolygon);
        this.generator.ResetCurve ();
        this.generator.AddConvexPolygonInverted (bottomPolygon);
        this.generator.AddConvexPolygon (topPolygon);
    }

    GenerateSurfaceBetweenPolygons (startIndices, endIndices)
    {
        if (startIndices.length !== endIndices.length) {
            return;
        }
        const vertexCount = startIndices.length;
        for (let i = 0; i < vertexCount; i++) {
            const index = i;
            const nextIndex = (i < vertexCount - 1) ? index + 1 : 0;
            this.generator.AddConvexPolygon ([
                startIndices[index],
                startIndices[nextIndex],
                endIndices[nextIndex],
                endIndices[index]
            ]);
        }
    }

    GenerateTriangleFan (startIndices, endIndex)
    {
        const vertexCount = startIndices.length;
        for (let i = 0; i < vertexCount; i++) {
            const index = i;
            const nextIndex = (i < vertexCount - 1) ? index + 1 : 0;
            this.generator.AddTriangle (
                endIndex,
                startIndices[index],
                startIndices[nextIndex]
            );
        }
    }
}

export function GenerateCuboid (genParams, xSize, ySize, zSize)
{
    let generator = new Generator (genParams);
    let vertices = [
        new Coord2D (0.0, 0.0),
        new Coord2D (xSize, 0.0),
        new Coord2D (xSize, ySize),
        new Coord2D (0.0, ySize),
    ];
    let helper = new GeneratorHelper (generator);
    helper.GenerateExtrude (vertices, zSize, null);
    return generator.GetMesh ();
}

export function GenerateCylinder (genParams, radius, height, segments, smooth)
{
    function GetCylindricalCoord (radius, angle)
    {
        return new Coord2D (
            radius * Math.cos (angle),
            radius * Math.sin (angle)
        );
    }

    if (segments < 3) {
        return null;
    }

    let generator = new Generator (genParams);
    let baseVertices = [];
	const step = 2.0 * Math.PI / segments;
	for (let i = 0; i < segments; i++) {
        let cylindrical = GetCylindricalCoord (radius, i * step);
		baseVertices.push (cylindrical);
	}
    let helper = new GeneratorHelper (generator);
    helper.GenerateExtrude (baseVertices, height, smooth ? 1 : null);
    return generator.GetMesh ();
}

export function GenerateSphere (genParams, radius, segments, smooth)
{
    function GetSphericalCoord (radius, theta, phi)
    {
        return new Coord3D (
            radius * Math.sin (theta) * Math.cos (phi),
            radius * Math.sin (theta) * Math.sin (phi),
            radius * Math.cos (theta)
        );
    }

    if (segments < 3) {
        return null;
    }

    let generator = new Generator (genParams);
    let helper = new GeneratorHelper (generator);

    generator.SetCurve (smooth ? 1 : null);

    let allLevelVertices = [];
    let levels = segments + 1;
    const levelStep = Math.PI / segments;
	const cylindricalStep = 2.0 * Math.PI / segments;
    for (let levelIndex = 1; levelIndex < levels - 1; levelIndex++) {
        let levelVertices = [];
        let theta = levelIndex * levelStep;
        for (let cylindricalIndex = 0; cylindricalIndex < segments; cylindricalIndex++) {
            let phi = cylindricalIndex * cylindricalStep;
            let vertex = GetSphericalCoord (radius, theta, -phi);
            levelVertices.push (generator.AddVertex (vertex.x, vertex.y, vertex.z));
        }
        if (levelIndex > 1) {
            helper.GenerateSurfaceBetweenPolygons (allLevelVertices[allLevelVertices.length - 1], levelVertices);
        }
        allLevelVertices.push (levelVertices);
    }

    let topVertex = generator.AddVertex (0.0, 0.0, radius);
    let bottomVertex = generator.AddVertex (0.0, 0.0, -radius);
    helper.GenerateTriangleFan (allLevelVertices[0].slice ().reverse (), topVertex);
    helper.GenerateTriangleFan (allLevelVertices[allLevelVertices.length - 1], bottomVertex);

    generator.ResetCurve ();

    return generator.GetMesh ();
}

export function GeneratePlatonicSolid (genParams, type, radius)
{
    function AddVertex (generator, radius, x, y, z)
    {
        let vertex = new Coord3D (x, y, z);
        vertex.MultiplyScalar (radius / vertex.Length ());
        generator.AddVertex (vertex.x, vertex.y, vertex.z);
    }

    if (IsZero (radius)) {
        return null;
    }

    let generator = new Generator (genParams);
    if (type === 'tetrahedron') {
        let a = 1.0;
        AddVertex (generator, radius, +a, +a, +a);
        AddVertex (generator, radius, -a, -a, +a);
        AddVertex (generator, radius, -a, +a, -a);
        AddVertex (generator, radius, +a, -a, -a);
        generator.AddTriangle (0, 1, 3);
        generator.AddTriangle (0, 2, 1);
        generator.AddTriangle (0, 3, 2);
        generator.AddTriangle (1, 2, 3);
    } else if (type === 'hexahedron') {
        let a = 1.0;
        AddVertex (generator, radius, +a, +a, +a);
        AddVertex (generator, radius, +a, +a, -a);
        AddVertex (generator, radius, +a, -a, +a);
        AddVertex (generator, radius, +a, -a, -a);
        AddVertex (generator, radius, -a, +a, +a);
        AddVertex (generator, radius, -a, +a, -a);
        AddVertex (generator, radius, -a, -a, +a);
        AddVertex (generator, radius, -a, -a, -a);
        generator.AddConvexPolygon ([0, 1, 5, 4]);
        generator.AddConvexPolygon ([0, 2, 3, 1]);
        generator.AddConvexPolygon ([0, 4, 6, 2]);
        generator.AddConvexPolygon ([1, 3, 7, 5]);
        generator.AddConvexPolygon ([2, 6, 7, 3]);
        generator.AddConvexPolygon ([4, 5, 7, 6]);
    } else if (type === 'octahedron') {
        let a = 1.0;
        let b = 0.0;
        AddVertex (generator, radius, +a, +b, +b);
        AddVertex (generator, radius, -a, +b, +b);
        AddVertex (generator, radius, +b, +a, +b);
        AddVertex (generator, radius, +b, -a, +b);
        AddVertex (generator, radius, +b, +b, +a);
        AddVertex (generator, radius, +b, +b, -a);
        generator.AddTriangle (0, 2, 4);
        generator.AddTriangle (0, 3, 5);
        generator.AddTriangle (0, 4, 3);
        generator.AddTriangle (0, 5, 2);
        generator.AddTriangle (1, 2, 5);
        generator.AddTriangle (1, 3, 4);
        generator.AddTriangle (1, 4, 2);
        generator.AddTriangle (1, 5, 3);
    } else if (type === 'dodecahedron') {
        let a = 1.0;
        let b = 0.0;
        let c = (1.0 + Math.sqrt (5.0)) / 2.0;
        let d = 1.0 / c;
        AddVertex (generator, radius, +a, +a, +a);
        AddVertex (generator, radius, +a, +a, -a);
        AddVertex (generator, radius, +a, -a, +a);
        AddVertex (generator, radius, -a, +a, +a);
        AddVertex (generator, radius, +a, -a, -a);
        AddVertex (generator, radius, -a, +a, -a);
        AddVertex (generator, radius, -a, -a, +a);
        AddVertex (generator, radius, -a, -a, -a);
        AddVertex (generator, radius, +b, +d, +c);
        AddVertex (generator, radius, +b, +d, -c);
        AddVertex (generator, radius, +b, -d, +c);
        AddVertex (generator, radius, +b, -d, -c);
        AddVertex (generator, radius, +d, +c, +b);
        AddVertex (generator, radius, +d, -c, +b);
        AddVertex (generator, radius, -d, +c, +b);
        AddVertex (generator, radius, -d, -c, +b);
        AddVertex (generator, radius, +c, +b, +d);
        AddVertex (generator, radius, -c, +b, +d);
        AddVertex (generator, radius, +c, +b, -d);
        AddVertex (generator, radius, -c, +b, -d);
        generator.AddConvexPolygon ([0, 8, 10, 2, 16]);
        generator.AddConvexPolygon ([0, 16, 18, 1, 12]);
        generator.AddConvexPolygon ([0, 12, 14, 3, 8]);
        generator.AddConvexPolygon ([1, 9, 5, 14, 12]);
        generator.AddConvexPolygon ([1, 18, 4, 11, 9]);
        generator.AddConvexPolygon ([2, 10, 6, 15, 13]);
        generator.AddConvexPolygon ([2, 13, 4, 18, 16]);
        generator.AddConvexPolygon ([3, 14, 5, 19, 17]);
        generator.AddConvexPolygon ([3, 17, 6, 10, 8]);
        generator.AddConvexPolygon ([4, 13, 15, 7, 11]);
        generator.AddConvexPolygon ([5, 9, 11, 7, 19]);
        generator.AddConvexPolygon ([6, 17, 19, 7, 15]);
    } else if (type === 'icosahedron') {
        let a = 1.0;
        let b = 0.0;
        let c = (1.0 + Math.sqrt (5.0)) / 2.0;
        AddVertex (generator, radius, +b, +a, +c);
        AddVertex (generator, radius, +b, +a, -c);
        AddVertex (generator, radius, +b, -a, +c);
        AddVertex (generator, radius, +b, -a, -c);
        AddVertex (generator, radius, +a, +c, +b);
        AddVertex (generator, radius, +a, -c, +b);
        AddVertex (generator, radius, -a, +c, +b);
        AddVertex (generator, radius, -a, -c, +b);
        AddVertex (generator, radius, +c, +b, +a);
        AddVertex (generator, radius, +c, +b, -a);
        AddVertex (generator, radius, -c, +b, +a);
        AddVertex (generator, radius, -c, +b, -a);
        generator.AddTriangle (0, 2, 8);
        generator.AddTriangle (0, 4, 6);
        generator.AddTriangle (0, 6, 10);
        generator.AddTriangle (0, 8, 4);
        generator.AddTriangle (0, 10, 2);
        generator.AddTriangle (1, 3, 11);
        generator.AddTriangle (1, 4, 9);
        generator.AddTriangle (1, 6, 4);
        generator.AddTriangle (1, 9, 3);
        generator.AddTriangle (1, 11, 6);
        generator.AddTriangle (2, 5, 8);
        generator.AddTriangle (2, 7, 5);
        generator.AddTriangle (2, 10, 7);
        generator.AddTriangle (3, 5, 7);
        generator.AddTriangle (3, 7, 11);
        generator.AddTriangle (3, 9, 5);
        generator.AddTriangle (4, 8, 9);
        generator.AddTriangle (5, 9, 8);
        generator.AddTriangle (6, 11, 10);
        generator.AddTriangle (7, 10, 11);
    }
    return generator.GetMesh ();
}
