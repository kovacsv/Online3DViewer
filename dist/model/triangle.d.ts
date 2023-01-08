export class Triangle {
    constructor(v0: any, v1: any, v2: any);
    v0: any;
    v1: any;
    v2: any;
    c0: any;
    c1: any;
    c2: any;
    n0: any;
    n1: any;
    n2: any;
    u0: any;
    u1: any;
    u2: any;
    mat: any;
    curve: any;
    HasVertices(): boolean;
    HasVertexColors(): boolean;
    HasNormals(): boolean;
    HasTextureUVs(): boolean;
    SetVertices(v0: any, v1: any, v2: any): Triangle;
    SetVertexColors(c0: any, c1: any, c2: any): Triangle;
    SetNormals(n0: any, n1: any, n2: any): Triangle;
    SetTextureUVs(u0: any, u1: any, u2: any): Triangle;
    SetMaterial(mat: any): Triangle;
    SetCurve(curve: any): Triangle;
    Clone(): Triangle;
}
//# sourceMappingURL=triangle.d.ts.map