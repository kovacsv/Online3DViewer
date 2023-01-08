export class Model extends ModelObject3D {
    root: Node;
    materials: any[];
    meshes: any[];
    GetRootNode(): Node;
    MaterialCount(): number;
    MeshCount(): number;
    MeshInstanceCount(): number;
    AddMaterial(material: any): number;
    GetMaterial(index: any): any;
    AddMesh(mesh: any): number;
    AddMeshToRootNode(mesh: any): number;
    RemoveMesh(index: any): void;
    GetMesh(index: any): any;
    GetMeshInstance(instanceId: any): MeshInstance;
    EnumerateMeshes(onMesh: any): void;
    EnumerateMeshInstances(onMeshInstance: any): void;
    EnumerateTransformedMeshes(onMesh: any): void;
}
import { ModelObject3D } from "./object.js";
import { Node } from "./node.js";
import { MeshInstance } from "./meshinstance.js";
//# sourceMappingURL=model.d.ts.map