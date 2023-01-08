export class TopologyVertex {
    edges: any[];
    triangles: any[];
}
export class TopologyEdge {
    constructor(vertex1: any, vertex2: any);
    vertex1: any;
    vertex2: any;
    triangles: any[];
}
export class TopologyTriangleEdge {
    constructor(edge: any, reversed: any);
    edge: any;
    reversed: any;
}
export class TopologyTriangle {
    triEdge1: any;
    triEdge2: any;
    triEdge3: any;
}
export class Topology {
    vertices: any[];
    edges: any[];
    triangleEdges: any[];
    triangles: any[];
    edgeStartToEndVertexMap: Map<any, any>;
    AddVertex(): number;
    AddTriangle(vertex1: any, vertex2: any, vertex3: any): void;
    AddTriangleEdge(vertex1: any, vertex2: any): number;
    AddEdge(startVertex: any, endVertex: any): any;
}
//# sourceMappingURL=topology.d.ts.map