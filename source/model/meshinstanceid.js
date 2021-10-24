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

    GetKey ()
    {
        return this.nodeId.toString () + ':' + this.meshIndex.toString ();
    }
};
