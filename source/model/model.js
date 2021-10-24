OV.MeshInstanceId = class
{
    constructor (nodeId, meshIndex)
    {
        this.nodeId = nodeId;
        this.meshIndex = meshIndex;
    }

    IsEqual (rhs)
    {
        return this.nodeId === rhs.nodeId && this.meshIndex === rhs.meshIndex;
    }
};

OV.Model = class extends OV.Element
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

    EnumerateVertices (onVertex)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateVertices (onVertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateTriangles (onTriangle);
        }
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        for (const mesh of this.meshes) {
            mesh.EnumerateTriangleVertices (onTriangleVertices);
        }
    }    
};
