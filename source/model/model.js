OV.Model = class extends OV.ModelObject3D
{
    constructor ()
    {
        super ();
        this.root = new OV.Node ();
        this.materials = [];
        this.meshes = [];
    }

    GetRootNode ()
    {
        return this.root;
    }

    MaterialCount ()
    {
        return this.materials.length;
    }

    MeshCount ()
    {
        return this.meshes.length;
    }

    VertexCount ()
    {
        let count = 0;
        for (let i = 0; i < this.meshes.length; i++) {
            count += this.meshes[i].VertexCount ();
        }
        return count;
    }

    NormalCount ()
    {
        let count = 0;
        for (let i = 0; i < this.meshes.length; i++) {
            count += this.meshes[i].NormalCount ();
        }
        return count;
    }

    TextureUVCount ()
    {
        let count = 0;
        for (let i = 0; i < this.meshes.length; i++) {
            count += this.meshes[i].TextureUVCount ();
        }
        return count;
    }

    TriangleCount ()
    {
        let count = 0;
        for (let i = 0; i < this.meshes.length; i++) {
            count += this.meshes[i].TriangleCount ();
        }
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

    AddMeshToIndex (mesh, index)
    {
        this.meshes.splice (index, 0, mesh);
        this.root.Enumerate ((node) => {
            for (let i = 0; i < node.meshIndices.length; i++) {
                if (node.meshIndices[i] >= index) {
                    node.meshIndices[i] += 1;
                }
            }
        });        
        return index;
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

    EnumerateMeshes (onMesh)
    {
        for (const mesh of this.meshes) {
            onMesh (mesh);
        }
    }

    EnumerateMeshInstances (onMeshInstance)
    {
        function EnumerateNodeMeshInstances (model, node, transformation, onMeshInstance)
        {
            let nodeTransformation = node.GetTransformation ().Clone ();
            nodeTransformation.Append (transformation);

            for (let childNode of node.GetChildNodes ()) {
                EnumerateNodeMeshInstances (model, childNode, nodeTransformation, onMeshInstance);
            }

            for (let meshIndex of node.GetMeshIndices ()) {
                let mesh = model.GetMesh (meshIndex);
                let meshInstance = new OV.MeshInstance (mesh, nodeTransformation);
                onMeshInstance (meshInstance);
            }
        }

        let transformation = new OV.Transformation ();
        EnumerateNodeMeshInstances (this, this.root, transformation, onMeshInstance);
    }

    EnumerateTransformedMeshInstances (onMesh)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            const mesh = OV.CloneMesh (meshInstance.mesh);
            OV.TransformMesh (mesh, meshInstance.transformation);
            onMesh (mesh);
        });
    }

    EnumerateVertices (onVertex)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateVertices (onVertex);
        }
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateTriangleVertexIndices (onTriangleVertexIndices);
        }
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateTriangleVertices (onTriangleVertices);
        }
    }
};
