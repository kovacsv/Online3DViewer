OV.IsModelEmpty = function (model)
{
    let isEmpty = true;
    model.EnumerateMeshInstances ((meshInstance) => {
        if (OV.GetMeshType (meshInstance) !== OV.MeshType.Empty) {
            isEmpty = false;
        }
    });
    return isEmpty;
};

OV.GetBoundingBox = function (object3D)
{
    let calculator = new OV.BoundingBoxCalculator3D ();
    object3D.EnumerateVertices ((vertex) => {
        calculator.AddPoint (vertex);
    });
    return calculator.GetBox ();
};

OV.GetTopology = function (object3D)
{
    function GetVertexIndex (vertex, octree, topology)
    {
        let index = octree.FindPoint (vertex);
        if (index === null) {
            index = topology.AddVertex ();
            octree.AddPoint (vertex, index);
        }
        return index;
    }

    let boundingBox = OV.GetBoundingBox (object3D);
    let octree = new OV.Octree (boundingBox);
    let topology = new OV.Topology ();

    object3D.EnumerateTriangleVertices ((v0, v1, v2) => {
        let v0Index = GetVertexIndex (v0, octree, topology);
        let v1Index = GetVertexIndex (v1, octree, topology);
        let v2Index = GetVertexIndex (v2, octree, topology);
        topology.AddTriangle (v0Index, v1Index, v2Index);
    });
    return topology;
};

OV.IsSolid = function (object3D)
{
    function GetEdgeOrientationInTriangle (topology, triangleIndex, edgeIndex)
    {
        const triangle = topology.triangles[triangleIndex];
        const triEdge1 = topology.triangleEdges[triangle.triEdge1];
        const triEdge2 = topology.triangleEdges[triangle.triEdge2];
        const triEdge3 = topology.triangleEdges[triangle.triEdge3];
        if (triEdge1.edge === edgeIndex) {
            return triEdge1.reversed;
        }
        if (triEdge2.edge === edgeIndex) {
            return triEdge2.reversed;
        }
        if (triEdge3.edge === edgeIndex) {
            return triEdge3.reversed;
        }
        return null;
    }

    const topology = OV.GetTopology (object3D);
    for (let edgeIndex = 0; edgeIndex < topology.edges.length; edgeIndex++) {
        const edge = topology.edges[edgeIndex];
        let triCount = edge.triangles.length;
        if (triCount === 0 || triCount % 2 !== 0) {
            return false;
        }
        let edgesDirection = 0;
        for (let triIndex = 0; triIndex < edge.triangles.length; triIndex++) {
            const triangleIndex = edge.triangles[triIndex];
            const edgeOrientation = GetEdgeOrientationInTriangle (topology, triangleIndex, edgeIndex);
            if (edgeOrientation) {
                edgesDirection += 1;
            } else {
                edgesDirection -= 1;
            }
        }
        if (edgesDirection !== 0) {
            return false;
        }
    }
    return true;
};

OV.HasDefaultMaterial = function (model)
{
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.isDefault && !material.vertexColors) {
            return true;
        }
    }
    return false;
};

OV.ReplaceDefaultMaterialColor = function (model, color)
{
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.isDefault) {
            material.color = color;
        }
    }
};
