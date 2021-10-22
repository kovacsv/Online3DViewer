OV.Node = class
{
    constructor ()
    {
        this.name = '';
        this.parent = null;
        this.childNodes = [];
        this.meshIndices = [];
    }

    HasParent ()
    {
        return this.parent !== null;
    }

    GetParent ()
    {
        return this.parent;
    }

    GetName ()
    {
        return this.name;
    }
    
    SetName (name)
    {
        this.name = name;
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

    AddMeshIndex (index)
    {
        this.meshIndices.push (index);
        return this.meshIndices.length - 1;
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
