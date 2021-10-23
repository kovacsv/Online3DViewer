OV.Node = class
{
    constructor ()
    {
        this.name = '';
        this.parent = null;
        this.transformation = new OV.Transformation ();
        this.childNodes = [];
        this.meshIndices = [];
    }

    IsEmpty ()
    {
        return this.childNodes.length === 0 && this.meshIndices.length === 0;
    }

    GetName ()
    {
        return this.name;
    }
    
    SetName (name)
    {
        this.name = name;
    }

    HasParent ()
    {
        return this.parent !== null;
    }

    GetParent ()
    {
        return this.parent;
    }

    GetTransformation ()
    {
        return this.transformation;
    }

    SetTransformation (transformation)
    {
        this.transformation = transformation; 
    }

    AddChildNode (node)
    {
        node.parent = this;
        this.childNodes.push (node);
        return this.childNodes.length - 1;
    }

    GetChildNodes ()
    {
        return this.childNodes;
    }

    ChildNodeCount ()
    {
        return this.childNodes.length;
    }

    GetChildNode (index)
    {
        return this.childNodes[index];
    }

    AddMeshIndex (index)
    {
        this.meshIndices.push (index);
        return this.meshIndices.length - 1;
    }

    MeshIndexCount ()
    {
        return this.meshIndices.length;
    }

    GetMeshIndex (index)
    {
        return this.meshIndices[index];
    }

    GetMeshIndices ()
    {
        return this.meshIndices;
    }

    Enumerate (processor)
    {
        processor (this);
        for (const childNode of this.childNodes) {
            childNode.Enumerate (processor);
        }
    }

    EnumerateChildren (processor)
    {
        for (const childNode of this.childNodes) {
            processor (childNode);
            childNode.EnumerateChildren (processor);
        }
    }

    EnumerateMeshIndices (processor)
    {
        for (const meshIndex of this.meshIndices) {
            processor (meshIndex);
        }
        for (const childNode of this.childNodes) {
            childNode.EnumerateMeshIndices (processor);
        }
    }
};
