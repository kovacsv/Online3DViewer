import { Transformation } from '../geometry/transformation.js';

class NodeIdGenerator
{
    constructor ()
    {
        this.nextId = 0;
    }

    GenerateId ()
    {
        const id = this.nextId;
        this.nextId += 1;
        return id;
    }
}

export class Node
{
    constructor ()
    {
        this.name = '';
        this.parent = null;
        this.transformation = new Transformation ();

        this.childNodes = [];
        this.meshIndices = [];

        this.idGenerator = new NodeIdGenerator ();
        this.id = this.idGenerator.GenerateId ();
    }

    IsEmpty ()
    {
        return this.childNodes.length === 0 && this.meshIndices.length === 0;
    }

    IsMeshNode ()
    {
        return this.childNodes.length === 0 && this.meshIndices.length === 1;
    }

    GetId ()
    {
        return this.id;
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

    GetWorldTransformation ()
    {
        let transformation = this.transformation.Clone ();
        let parent = this.parent;
        while (parent !== null) {
            transformation.Append (parent.transformation);
            parent = parent.parent;
        }
        return transformation;
    }

    SetTransformation (transformation)
    {
        this.transformation = transformation;
    }

    AddChildNode (node)
    {
        node.parent = this;
        node.idGenerator = this.idGenerator;
        node.id = node.idGenerator.GenerateId ();
        this.childNodes.push (node);
        return this.childNodes.length - 1;
    }

    RemoveChildNode (node)
    {
        node.parent = null;
        let index = this.childNodes.indexOf (node);
        this.childNodes.splice (index, 1);
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
}
