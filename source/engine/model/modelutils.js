import { BoundingBoxCalculator3D } from '../geometry/box3d.js';
import { Octree } from '../geometry/octree.js';
import { MaterialSource } from './material.js';
import { IsEmptyMesh } from './meshutils.js';
import { Model } from './model.js';
import { Topology } from './topology.js';

export function IsModelEmpty (model)
{
    let isEmpty = true;
    model.EnumerateMeshInstances ((meshInstance) => {
        if (!IsEmptyMesh (meshInstance)) {
            isEmpty = false;
        }
    });
    return isEmpty;
}

export function GetBoundingBox (object3D)
{
    let calculator = new BoundingBoxCalculator3D ();
    object3D.EnumerateVertices ((vertex) => {
        calculator.AddPoint (vertex);
    });
    return calculator.GetBox ();
}

export function GetTopology (object3D)
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

    let boundingBox = GetBoundingBox (object3D);
    let octree = new Octree (boundingBox);
    let topology = new Topology ();

    object3D.EnumerateTriangleVertices ((v0, v1, v2) => {
        let v0Index = GetVertexIndex (v0, octree, topology);
        let v1Index = GetVertexIndex (v1, octree, topology);
        let v2Index = GetVertexIndex (v2, octree, topology);
        topology.AddTriangle (v0Index, v1Index, v2Index);
    });
    return topology;
}

export function IsTwoManifold (object3D)
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

    if (object3D instanceof Model) {
        let isTwoManifold = true;
        object3D.EnumerateMeshInstances ((meshInstance) => {
            if (isTwoManifold) {
                isTwoManifold = IsTwoManifold (meshInstance);
            }
        });
        return isTwoManifold;
    } else {
        const topology = GetTopology (object3D);
        for (let edgeIndex = 0; edgeIndex < topology.edges.length; edgeIndex++) {
            const edge = topology.edges[edgeIndex];
            if (edge.triangles.length !== 2) {
                return false;
            }

            let edgeOrientation1 = GetEdgeOrientationInTriangle (topology, edge.triangles[0], edgeIndex);
            let edgeOrientation2 = GetEdgeOrientationInTriangle (topology, edge.triangles[1], edgeIndex);
            if (edgeOrientation1 === null || edgeOrientation2 === null || edgeOrientation1 === edgeOrientation2) {
                return false;
            }
        }
        return true;
    }
}

export function GetDefaultMaterials (model)
{
    let defaultMaterials = [];
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.source !== MaterialSource.Model && !material.vertexColors) {
            defaultMaterials.push (material);
        }
    }
    return defaultMaterials;
}

export function ReplaceDefaultMaterialsColor (model, color, lineColor)
{
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.source === MaterialSource.DefaultFace) {
            material.color = color;
        } else if (material.source === MaterialSource.DefaultLine) {
            material.color = lineColor;
        }
    }
}
