import { BoundingBoxCalculator3D } from '../geometry/box3d.js';
import { AddCoord3D, CrossVector3D, DotVector3D, SubCoord3D } from '../geometry/coord3d.js';
import { IsNegative } from '../geometry/geometry.js';
import { Octree } from '../geometry/octree.js';
import { MeshInstance } from './meshinstance.js';
import { Model } from './model.js';
import { GetBoundingBox } from './modelutils.js';
import { GetTetrahedronSignedVolume } from './quantities.js';
import { Topology } from './topology.js';

export class MeshCheckResult
{
    constructor ()
    {
        this.vertexCount = 0;
        this.edgeCount = 0;
        this.triangleCount = 0;
        this.degenerateTriangleCount = 0;
        this.boundaryEdgeCount = 0;
        this.holeCount = 0;
        this.nonManifoldEdgeCount = 0;
        this.nonManifoldVertexCount = 0;
        this.inconsistentEdgeCount = 0;
        this.bodyCount = 0;
        this.eulerCharacteristic = 0;
        this.isWatertight = false;
        this.isInsideOut = false;
        // Six coordinates per edge, ready to use as a line segments position attribute.
        this.boundaryEdgePositions = new Float32Array (0);
        this.nonManifoldEdgePositions = new Float32Array (0);
    }
}

class UnionFind
{
    constructor (count)
    {
        this.parents = [];
        for (let i = 0; i < count; i++) {
            this.parents.push (i);
        }
    }

    Find (index)
    {
        while (this.parents[index] !== index) {
            this.parents[index] = this.parents[this.parents[index]];
            index = this.parents[index];
        }
        return index;
    }

    Union (index1, index2)
    {
        this.parents[this.Find (index1)] = this.Find (index2);
    }
}

function EnumerateOrientedTriangleVertices (object3D, onTriangleVertices)
{
    // A mirroring transformation reverses the winding order. Renderers flip it
    // back (glTF defines it this way), so the check does the same.
    function EnumerateMeshInstance (meshInstance)
    {
        const matrix = meshInstance.GetTransformation ().GetMatrix ();
        if (IsNegative (matrix.Determinant ())) {
            meshInstance.EnumerateTriangleVertices ((v0, v1, v2) => {
                onTriangleVertices (v0, v2, v1);
            });
        } else {
            meshInstance.EnumerateTriangleVertices (onTriangleVertices);
        }
    }

    if (object3D instanceof Model) {
        object3D.EnumerateMeshInstances (EnumerateMeshInstance);
    } else if (object3D instanceof MeshInstance) {
        EnumerateMeshInstance (object3D);
    } else {
        object3D.EnumerateTriangleVertices (onTriangleVertices);
    }
}

function GetTopologyWithPositions (object3D)
{
    // Same welding as GetTopology, but keeps the position of every welded vertex.
    let octree = new Octree (GetBoundingBox (object3D));
    let topology = new Topology ();
    let positions = [];
    let triangleVertices = [];
    let degenerateTriangleCount = 0;
    function GetVertexIndex (vertex)
    {
        let index = octree.FindPoint (vertex);
        if (index === null) {
            index = topology.AddVertex ();
            octree.AddPoint (vertex, index);
            positions.push (vertex);
        }
        return index;
    }

    EnumerateOrientedTriangleVertices (object3D, (v0, v1, v2) => {
        let v0Index = GetVertexIndex (v0);
        let v1Index = GetVertexIndex (v1);
        let v2Index = GetVertexIndex (v2);
        // A triangle collapsed by welding has no area, but it would add a false hole or non-manifold edge.
        if (v0Index === v1Index || v1Index === v2Index || v0Index === v2Index) {
            degenerateTriangleCount += 1;
            return;
        }
        topology.AddTriangle (v0Index, v1Index, v2Index);
        triangleVertices.push (v0Index, v1Index, v2Index);
    });
    return {
        topology : topology,
        positions : positions,
        triangleVertices : triangleVertices,
        degenerateTriangleCount : degenerateTriangleCount
    };
}

function GetTriangleEdgeIndices (topology, triangleIndex)
{
    const triangle = topology.triangles[triangleIndex];
    return [
        topology.triangleEdges[triangle.triEdge1].edge,
        topology.triangleEdges[triangle.triEdge2].edge,
        topology.triangleEdges[triangle.triEdge3].edge
    ];
}

function GetEdgePositions (topology, positions, edgeIndices)
{
    let edgePositions = new Float32Array (edgeIndices.length * 6);
    for (let i = 0; i < edgeIndices.length; i++) {
        const edge = topology.edges[edgeIndices[i]];
        const start = positions[edge.vertex1];
        const end = positions[edge.vertex2];
        edgePositions.set ([start.x, start.y, start.z, end.x, end.y, end.z], i * 6);
    }
    return edgePositions;
}

function CountInconsistentEdges (topology)
{
    let forwardCounts = new Array (topology.edges.length).fill (0);
    for (const triangleEdge of topology.triangleEdges) {
        if (!triangleEdge.reversed) {
            forwardCounts[triangleEdge.edge] += 1;
        }
    }

    // A consistently oriented edge is traversed once in each direction.
    let inconsistentCount = 0;
    for (let edgeIndex = 0; edgeIndex < topology.edges.length; edgeIndex++) {
        const edge = topology.edges[edgeIndex];
        if (edge.triangles.length === 2 && forwardCounts[edgeIndex] !== 1) {
            inconsistentCount += 1;
        }
    }
    return inconsistentCount;
}

function CountHoles (topology, boundaryEdgeIndices)
{
    // hole = connected set of boundary edges. Unlike walking the chains, this does
    // not depend on triangle order where a boundary touches itself (figure-8), and
    // counts an open chain ending at a non-manifold edge once.
    let unionFind = new UnionFind (topology.vertices.length);
    for (const edgeIndex of boundaryEdgeIndices) {
        const edge = topology.edges[edgeIndex];
        unionFind.Union (edge.vertex1, edge.vertex2);
    }

    let holeRoots = new Set ();
    for (const edgeIndex of boundaryEdgeIndices) {
        holeRoots.add (unionFind.Find (topology.edges[edgeIndex].vertex1));
    }
    return holeRoots.size;
}

function CountTriangleFansAroundVertex (topology, vertexIndex)
{
    // Triangles around a vertex belong to the same fan if they share an edge of this vertex.
    let visited = new Set ();
    let fanCount = 0;
    for (const startTriangleIndex of topology.vertices[vertexIndex].triangles) {
        if (visited.has (startTriangleIndex)) {
            continue;
        }
        fanCount += 1;
        visited.add (startTriangleIndex);
        let stack = [startTriangleIndex];
        while (stack.length > 0) {
            const triangleIndex = stack.pop ();
            for (const edgeIndex of GetTriangleEdgeIndices (topology, triangleIndex)) {
                const edge = topology.edges[edgeIndex];
                if (edge.vertex1 !== vertexIndex && edge.vertex2 !== vertexIndex) {
                    continue;
                }
                for (const neighbourIndex of edge.triangles) {
                    if (!visited.has (neighbourIndex)) {
                        visited.add (neighbourIndex);
                        stack.push (neighbourIndex);
                    }
                }
            }
        }
    }
    return fanCount;
}

function GetBodies (topology)
{
    let unionFind = new UnionFind (topology.triangles.length);
    for (const edge of topology.edges) {
        for (let i = 1; i < edge.triangles.length; i++) {
            unionFind.Union (edge.triangles[0], edge.triangles[i]);
        }
    }

    // Triangle indices of each body.
    let bodyIndexOfRoot = new Map ();
    let bodies = [];
    for (let triangleIndex = 0; triangleIndex < topology.triangles.length; triangleIndex++) {
        const root = unionFind.Find (triangleIndex);
        if (!bodyIndexOfRoot.has (root)) {
            bodyIndexOfRoot.set (root, bodies.length);
            bodies.push ([]);
        }
        bodies[bodyIndexOfRoot.get (root)].push (triangleIndex);
    }
    return bodies;
}

function IsPointInBox (box, point)
{
    return point.x >= box.min.x && point.x <= box.max.x &&
        point.y >= box.min.y && point.y <= box.max.y &&
        point.z >= box.min.z && point.z <= box.max.z;
}

function GetTriangleSolidAngle (point, v0, v1, v2)
{
    // Van Oosterom and Strackee: signed solid angle of the triangle seen from the point.
    const a = SubCoord3D (v0, point);
    const b = SubCoord3D (v1, point);
    const c = SubCoord3D (v2, point);
    const aLength = a.Length ();
    const bLength = b.Length ();
    const cLength = c.Length ();
    const numerator = DotVector3D (a, CrossVector3D (b, c));
    const denominator = aLength * bLength * cLength + DotVector3D (a, b) * cLength + DotVector3D (a, c) * bLength + DotVector3D (b, c) * aLength;
    return 2.0 * Math.atan2 (numerator, denominator);
}

function IsAnyBodyInsideOut (positions, triangleVertices, bodies)
{
    function GetTrianglePositions (triangleIndex)
    {
        return [
            positions[triangleVertices[triangleIndex * 3]],
            positions[triangleVertices[triangleIndex * 3 + 1]],
            positions[triangleVertices[triangleIndex * 3 + 2]]
        ];
    }

    let bodyBoxes = [];
    let bodyVolumes = [];
    for (const body of bodies) {
        let boxCalculator = new BoundingBoxCalculator3D ();
        let volume = 0.0;
        for (const triangleIndex of body) {
            const [v0, v1, v2] = GetTrianglePositions (triangleIndex);
            boxCalculator.AddPoint (v0);
            boxCalculator.AddPoint (v1);
            boxCalculator.AddPoint (v2);
            volume += GetTetrahedronSignedVolume (v0, v1, v2);
        }
        bodyBoxes.push (boxCalculator.GetBox ());
        bodyVolumes.push (volume);
    }

    // A body with negative volume is fine if it is a cavity, i.e. it lies inside
    // material. The winding number of the other bodies tells this: 1 inside
    // material, 0 outside. A closed body adds 0 to a point outside its box.
    for (let bodyIndex = 0; bodyIndex < bodies.length; bodyIndex++) {
        if (bodyVolumes[bodyIndex] >= 0.0) {
            continue;
        }
        const [v0, v1, v2] = GetTrianglePositions (bodies[bodyIndex][0]);
        const testPoint = AddCoord3D (AddCoord3D (v0, v1), v2).MultiplyScalar (1.0 / 3.0);
        let solidAngle = 0.0;
        for (let otherIndex = 0; otherIndex < bodies.length; otherIndex++) {
            if (otherIndex === bodyIndex || !IsPointInBox (bodyBoxes[otherIndex], testPoint)) {
                continue;
            }
            for (const triangleIndex of bodies[otherIndex]) {
                const [t0, t1, t2] = GetTrianglePositions (triangleIndex);
                solidAngle += GetTriangleSolidAngle (testPoint, t0, t1, t2);
            }
        }
        const windingNumber = solidAngle / (4.0 * Math.PI);
        if (windingNumber < 0.5) {
            return true;
        }
    }
    return false;
}

// Collects topology diagnostics of a model, mesh or mesh instance. A model is
// checked as one surface in world space, so meshes touching each other are
// welded together, like a slicer sees them. Problem edges are in world space.
export function CheckMesh (object3D)
{
    const { topology, positions, triangleVertices, degenerateTriangleCount } = GetTopologyWithPositions (object3D);
    let result = new MeshCheckResult ();
    result.vertexCount = topology.vertices.filter ((vertex) => vertex.triangles.length > 0).length;
    result.edgeCount = topology.edges.length;
    result.triangleCount = topology.triangles.length;
    result.degenerateTriangleCount = degenerateTriangleCount;

    let boundaryEdgeIndices = [];
    let nonManifoldEdgeIndices = [];
    for (let edgeIndex = 0; edgeIndex < topology.edges.length; edgeIndex++) {
        const edgeTriangleCount = topology.edges[edgeIndex].triangles.length;
        if (edgeTriangleCount === 1) {
            boundaryEdgeIndices.push (edgeIndex);
        } else if (edgeTriangleCount > 2) {
            nonManifoldEdgeIndices.push (edgeIndex);
        }
    }
    result.boundaryEdgeCount = boundaryEdgeIndices.length;
    result.nonManifoldEdgeCount = nonManifoldEdgeIndices.length;
    result.boundaryEdgePositions = GetEdgePositions (topology, positions, boundaryEdgeIndices);
    result.nonManifoldEdgePositions = GetEdgePositions (topology, positions, nonManifoldEdgeIndices);
    for (let vertexIndex = 0; vertexIndex < topology.vertices.length; vertexIndex++) {
        if (CountTriangleFansAroundVertex (topology, vertexIndex) > 1) {
            result.nonManifoldVertexCount += 1;
        }
    }

    const bodies = GetBodies (topology);
    result.holeCount = CountHoles (topology, boundaryEdgeIndices);
    result.inconsistentEdgeCount = CountInconsistentEdges (topology);
    result.bodyCount = bodies.length;
    result.eulerCharacteristic = result.vertexCount - result.edgeCount + result.triangleCount;
    result.isWatertight = result.triangleCount > 0 && result.boundaryEdgeCount === 0 && result.nonManifoldEdgeCount === 0;

    // Signed volume is meaningful only for a closed, consistently oriented surface.
    if (result.isWatertight && result.inconsistentEdgeCount === 0) {
        result.isInsideOut = IsAnyBodyInsideOut (positions, triangleVertices, bodies);
    }
    return result;
}
