export class OctreeNode {
    constructor(boundingBox: any, level: any);
    boundingBox: any;
    level: any;
    pointItems: any[];
    childNodes: any[];
    AddPoint(point: any, data: any, options: any): any;
    FindPoint(point: any): any;
    AddPointDirectly(point: any, data: any): void;
    FindPointDirectly(point: any): any;
    FindNodeForPoint(point: any): any;
    CreateChildNodes(): void;
    IsPointInBounds(point: any): boolean;
}
export class Octree {
    constructor(boundingBox: any, options: any);
    options: {
        maxPointsPerNode: number;
        maxTreeDepth: number;
    };
    rootNode: OctreeNode;
    AddPoint(point: any, data: any): any;
    FindPoint(point: any): any;
}
//# sourceMappingURL=octree.d.ts.map