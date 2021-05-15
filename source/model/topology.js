OV.TopologyVertex = class
{
    constructor ()
    {
        this.edges = [];
        this.triangles = [];
    }
};

OV.TopologyEdge = class
{
    constructor (vertex1, vertex2)
    {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.triangles = [];
    }
};

OV.TopologyTriangleEdge = class
{
    constructor (edge, reversed)
    {
        this.edge = edge;
        this.reversed = reversed;
    }
};

OV.TopologyTriangle = class
{
    constructor ()
    {
        this.triEdge1 = null;
        this.triEdge2 = null;
        this.triEdge3 = null;
    }
};

OV.Topology = class
{
    constructor ()
    {
        this.vertices = [];
        this.edges = [];
        this.triangleEdges = [];
        this.triangles = [];
        this.edgeStartToEndVertexMap = {};
    }

    AddVertex ()
    {
        this.vertices.push (new OV.TopologyVertex ());
        return this.vertices.length - 1;
    }

    AddTriangle (vertex1, vertex2, vertex3)
    {
        function AddTriangleToVertex (vertices, vertexIndex, triangleIndex)
        {
            let vertex = vertices[vertexIndex];
            vertex.triangles.push (triangleIndex);
        }

        function AddEdgeToVertex (vertices, triangleEdges, vertexIndex, triangleEdgeIndex)
        {
            let vertex = vertices[vertexIndex];
            let triangleEdge = triangleEdges[triangleEdgeIndex];
            vertex.edges.push (triangleEdge.edge);
        }

        function AddTriangleToEdge (edges, triangleEdges, triangleEdgeIndex, triangleIndex)
        {
            let triangleEdge = triangleEdges[triangleEdgeIndex];
            let edge = edges[triangleEdge.edge];
            edge.triangles.push (triangleIndex);
        }

        let triangleIndex = this.triangles.length;
        let triangle = new OV.TopologyTriangle ();
        triangle.triEdge1 = this.AddTriangleEdge (vertex1, vertex2);
        triangle.triEdge2 = this.AddTriangleEdge (vertex2, vertex3);
        triangle.triEdge3 = this.AddTriangleEdge (vertex3, vertex1);

        AddTriangleToVertex (this.vertices, vertex1, triangleIndex);
        AddTriangleToVertex (this.vertices, vertex2, triangleIndex);
        AddTriangleToVertex (this.vertices, vertex3, triangleIndex);

        AddEdgeToVertex (this.vertices, this.triangleEdges, vertex1, triangle.triEdge1);
        AddEdgeToVertex (this.vertices, this.triangleEdges, vertex2, triangle.triEdge2);
        AddEdgeToVertex (this.vertices, this.triangleEdges, vertex3, triangle.triEdge3);

        AddTriangleToEdge (this.edges, this.triangleEdges, triangle.triEdge1, triangleIndex);
        AddTriangleToEdge (this.edges, this.triangleEdges, triangle.triEdge2, triangleIndex);
        AddTriangleToEdge (this.edges, this.triangleEdges, triangle.triEdge3, triangleIndex);

        this.triangles.push (triangle);
    }

    AddTriangleEdge (vertex1, vertex2)
    {
        let startVertex = vertex1;
        let endVertex = vertex2;
        let reversed = false;
        if (vertex2 < vertex1) {
            startVertex = vertex2;
            endVertex = vertex1;
            reversed = true;
        }

        let edgeIndex = this.AddEdge (startVertex, endVertex);
        this.triangleEdges.push (new OV.TopologyTriangleEdge (edgeIndex, reversed));
        return this.triangleEdges.length - 1;
    }

    AddEdge (startVertex, endVertex)
    {
        if (this.edgeStartToEndVertexMap[startVertex] === undefined) {
            this.edgeStartToEndVertexMap[startVertex] = [];
        }
        
        let endVertices = this.edgeStartToEndVertexMap[startVertex];
        for (let i = 0; i < endVertices.length; i++) {
            let endVertexItem = endVertices[i];
            if (endVertexItem.endVertex === endVertex) {
                return endVertexItem.edgeIndex;
            }
        }

        let edgeIndex = this.edges.length;
        endVertices.push ({
            endVertex : endVertex,
            edgeIndex : edgeIndex
        });

        this.edges.push (new OV.TopologyEdge (startVertex, endVertex));
        return edgeIndex;
    }
};
