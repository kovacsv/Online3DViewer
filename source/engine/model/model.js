import { MeshInstance, MeshInstanceId } from './meshinstance.js';
import { Node } from './node.js';
import { ModelObject3D } from './object.js';
import { Unit } from './unit.js';

export class Model extends ModelObject3D
{
    constructor ()
    {
        super ();
        this.unit = Unit.Unknown;
        this.root = new Node ();
        this.materials = [];
        this.meshes = [];
    }

    GetUnit ()
    {
        return this.unit;
    }

    SetUnit (unit)
    {
        this.unit = unit;
    }

    GetRootNode ()
    {
        return this.root;
    }

    NodeCount ()
    {
        let count = 0;
        this.root.Enumerate ((node) => {
            count += 1;
        });
        return count - 1;
    }

    MaterialCount ()
    {
        return this.materials.length;
    }

    MeshCount ()
    {
        return this.meshes.length;
    }

    MeshInstanceCount ()
    {
        let count = 0;
        this.root.Enumerate ((node) => {
            count += node.MeshIndexCount ();
        });
        return count;
    }

    VertexCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.VertexCount ();
        });
        return count;
    }

    VertexColorCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.VertexColorCount ();
        });
        return count;
    }

    NormalCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.NormalCount ();
        });
        return count;
    }

    TextureUVCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.TextureUVCount ();
        });
        return count;
    }

    LineCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.LineCount ();
        });
        return count;
    }

    LineSegmentCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.LineSegmentCount ();
        });
        return count;
    }

    TriangleCount ()
    {
        let count = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            count += meshInstance.TriangleCount ();
        });
        return count;
    }

    AddMaterial (material)
    {
        this.materials.push (material);
        return this.materials.length - 1;
    }

    GetMaterial (index)
    {
        return this.materials[index];
    }

    AddMesh (mesh)
    {
        this.meshes.push (mesh);
        return this.meshes.length - 1;
    }

    AddMeshToRootNode (mesh)
    {
        const meshIndex = this.AddMesh (mesh);
        this.root.AddMeshIndex (meshIndex);
        return meshIndex;
    }

    RemoveMesh (index)
    {
        this.meshes.splice (index, 1);
        this.root.Enumerate ((node) => {
            for (let i = 0; i < node.meshIndices.length; i++) {
                if (node.meshIndices[i] === index) {
                    node.meshIndices.splice (i, 1);
                    i -= 1;
                } else if (node.meshIndices[i] > index) {
                    node.meshIndices[i] -= 1;
                }
            }
        });
    }

    GetMesh (index)
    {
        return this.meshes[index];
    }

    GetMeshInstance (instanceId)
    {
        let foundNode = null;
        this.root.Enumerate ((node) => {
            if (node.GetId () === instanceId.nodeId) {
                foundNode = node;
            }
        });
        if (foundNode === null) {
            return null;
        }
        const nodeMeshIndices = foundNode.GetMeshIndices ();
        if (nodeMeshIndices.indexOf (instanceId.meshIndex) === -1) {
            return null;
        }
        let foundMesh = this.GetMesh (instanceId.meshIndex);
        let id = new MeshInstanceId (foundNode.GetId (), instanceId.meshIndex);
        return new MeshInstance (id, foundNode, foundMesh);
    }

    EnumerateMeshes (onMesh)
    {
        for (const mesh of this.meshes) {
            onMesh (mesh);
        }
    }

    EnumerateMeshInstances (onMeshInstance)
    {
        this.root.Enumerate ((node) => {
            for (let meshIndex of node.GetMeshIndices ()) {
                let id = new MeshInstanceId (node.GetId (), meshIndex);
                let mesh = this.GetMesh (meshIndex);
                let meshInstance = new MeshInstance (id, node, mesh);
                onMeshInstance (meshInstance);
            }
        });
    }

    EnumerateTransformedMeshInstances (onMesh)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            const transformed = meshInstance.GetTransformedMesh ();
            onMesh (transformed);
        });
    }

    EnumerateVertices (onVertex)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateVertices (onVertex);
        });
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateTriangleVertexIndices (onTriangleVertexIndices);
        });
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstance.EnumerateTriangleVertices (onTriangleVertices);
        });
    }
}
