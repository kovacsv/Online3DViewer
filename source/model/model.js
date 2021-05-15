OV.Model = class
{
    constructor ()
    {
        this.name = '';
        this.materials = [];
        this.meshes = [];
    }

    GetName ()
    {
        return this.name;
    }

    SetName (name)
    {
        this.name = name;
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
    
    Clear ()
    {
        this.name = '';
        this.materials = [];
        this.meshes = [];
    }
};
