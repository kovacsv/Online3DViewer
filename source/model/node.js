OV.Node = class
{
    constructor ()
    {
        this.parent = null;
        this.name = '';
        this.childNodes = [];
        this.meshIndices = [];
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

    EnumerateChildren (processor)
    {
        for (const childNode of this.childNodes) {
            processor (childNode);
            childNode.EnumerateChildren (processor);
        }
    }
};
