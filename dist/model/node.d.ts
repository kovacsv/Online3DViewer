export namespace NodeType {
    const GroupNode: number;
    const MeshNode: number;
}
export class Node {
    type: number;
    name: string;
    parent: any;
    transformation: Transformation;
    childNodes: any[];
    meshIndices: any[];
    idGenerator: NodeIdGenerator;
    id: number;
    IsEmpty(): boolean;
    GetType(): number;
    SetType(type: any): void;
    GetId(): number;
    GetName(): string;
    SetName(name: any): void;
    HasParent(): boolean;
    GetParent(): any;
    GetTransformation(): Transformation;
    GetWorldTransformation(): Transformation;
    SetTransformation(transformation: any): void;
    AddChildNode(node: any): number;
    RemoveChildNode(node: any): void;
    GetChildNodes(): any[];
    ChildNodeCount(): number;
    GetChildNode(index: any): any;
    AddMeshIndex(index: any): number;
    MeshIndexCount(): number;
    GetMeshIndex(index: any): any;
    GetMeshIndices(): any[];
    Enumerate(processor: any): void;
    EnumerateChildren(processor: any): void;
    EnumerateMeshIndices(processor: any): void;
}
import { Transformation } from "../geometry/transformation.js";
declare class NodeIdGenerator {
    nextId: number;
    GenerateId(): number;
}
export {};
//# sourceMappingURL=node.d.ts.map