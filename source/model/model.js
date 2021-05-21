OV.Model = class extends OV.Element
{
    constructor ()
    {
        super ();
        this.materials = [];
        this.meshes = [];
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
        return index;
    }

    RemoveMesh (index)
    {
        this.meshes.splice (index, 1);
    }

    GetMesh (index)
    {
        return this.meshes[index];
    }
    
    EnumerateVertices (onVertex)
    {
        for (let meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            let mesh = this.meshes[meshIndex];
            mesh.EnumerateVertices (onVertex);
        }
    }

    EnumerateTriangles (onTriangle)
    {
        for (let meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
            let mesh = this.meshes[meshIndex];
            mesh.EnumerateTriangles (onTriangle);
        }
    }
};
