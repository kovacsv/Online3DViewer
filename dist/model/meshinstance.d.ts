export class MeshInstanceId {
    constructor(nodeId: any, meshIndex: any);
    nodeId: any;
    meshIndex: any;
    IsEqual(rhs: any): boolean;
    GetKey(): string;
}
export class MeshInstance extends ModelObject3D {
    constructor(id: any, node: any, mesh: any);
    id: any;
    node: any;
    mesh: any;
    GetId(): any;
    GetTransformation(): any;
    GetMesh(): any;
    VertexCount(): any;
    VertexColorCount(): any;
    NormalCount(): any;
    TextureUVCount(): any;
    TriangleCount(): any;
    PropertyGroupCount(): any;
    AddPropertyGroup(propertyGroup: any): any;
    GetTransformedMesh(): any;
}
import { ModelObject3D } from "./object.js";
//# sourceMappingURL=meshinstance.d.ts.map