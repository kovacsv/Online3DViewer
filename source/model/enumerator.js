OV.Enumerator = class
{
    constructor ()
    {

    }

    EnumerateVertices (onVertex)
    {

    }

    EnumerateTriangles (onTriangle)
    {

    }
};

OV.MeshEnumerator = class extends OV.Enumerator
{
    constructor (mesh)
    {
        super ();
        this.mesh = mesh;
    }

    EnumerateVertices (onVertex)
    {
        for (let vertexIndex = 0; vertexIndex < this.mesh.VertexCount (); vertexIndex++) {
            let vertex = this.mesh.GetVertex (vertexIndex);
            onVertex (vertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (let triangleIndex = 0; triangleIndex < this.mesh.TriangleCount (); triangleIndex++) {
            let triangle = this.mesh.GetTriangle (triangleIndex);
            let v0 = this.mesh.GetVertex (triangle.v0);
            let v1 = this.mesh.GetVertex (triangle.v1);
            let v2 = this.mesh.GetVertex (triangle.v2);
            onTriangle (v0, v1, v2);
        }
    }   
};

OV.MeshEnumerator = class extends OV.Enumerator
{
    constructor (mesh)
    {
        super ();
        this.mesh = mesh;
    }

    EnumerateVertices (onVertex)
    {
        for (let vertexIndex = 0; vertexIndex < this.mesh.VertexCount (); vertexIndex++) {
            let vertex = this.mesh.GetVertex (vertexIndex);
            onVertex (vertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (let triangleIndex = 0; triangleIndex < this.mesh.TriangleCount (); triangleIndex++) {
            let triangle = this.mesh.GetTriangle (triangleIndex);
            let v0 = this.mesh.GetVertex (triangle.v0);
            let v1 = this.mesh.GetVertex (triangle.v1);
            let v2 = this.mesh.GetVertex (triangle.v2);
            onTriangle (v0, v1, v2);
        }
    }   
};

OV.ModelEnumerator = class extends OV.Enumerator
{
    constructor (model)
    {
        super ();
        this.model = model;
    }

    EnumerateVertices (onVertex)
    {
        for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
            let mesh = this.model.GetMesh (meshIndex);
            let enumerator = new OV.MeshEnumerator (mesh);
            enumerator.EnumerateVertices (onVertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
            let mesh = this.model.GetMesh (meshIndex);
            let enumerator = new OV.MeshEnumerator (mesh);
            enumerator.EnumerateTriangles (onTriangle);
        }
    }   
};
