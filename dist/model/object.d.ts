export class Object3D {
    VertexCount(): number;
    VertexColorCount(): number;
    NormalCount(): number;
    TextureUVCount(): number;
    TriangleCount(): number;
    EnumerateVertices(onVertex: any): void;
    EnumerateTriangleVertexIndices(onTriangleVertexIndices: any): void;
    EnumerateTriangleVertices(onTriangleVertices: any): void;
}
export class ModelObject3D extends Object3D {
    name: string;
    propertyGroups: any[];
    GetName(): string;
    SetName(name: any): void;
    PropertyGroupCount(): number;
    AddPropertyGroup(propertyGroup: any): number;
    GetPropertyGroup(index: any): any;
    CloneProperties(target: any): void;
}
//# sourceMappingURL=object.d.ts.map