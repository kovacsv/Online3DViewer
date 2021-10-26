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

OV.MeshInstance = class extends OV.ModelObject3D
{
    constructor (node, mesh)
    {
        super ();
        this.node = node;
        this.mesh = mesh;
    }

    VertexCount ()
    {
        return this.mesh.VertexCount ();
    }

    NormalCount ()
    {
        return this.mesh.NormalCount ();
    }

    TextureUVCount ()
    {
        return this.mesh.TextureUVCount ();
    }

    TriangleCount ()
    {
        return this.mesh.TriangleCount ();
    }

    EnumerateVertices (onVertex)
    {
        let transformation = this.node.GetWorldTransformation ();
        if (transformation.IsIdentity ()) {
            this.mesh.EnumerateVertices (onVertex);
        } else {
            this.mesh.EnumerateVertices ((vertex) => {
                const transformed = transformation.TransformCoord3D (vertex);
                onVertex (transformed);
            });
        }
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        this.mesh.EnumerateTriangleVertexIndices (onTriangleVertexIndices);
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        let transformation = this.node.GetWorldTransformation ();
        if (transformation.IsIdentity ()) {
            this.mesh.EnumerateTriangleVertices (onTriangleVertices);
        } else {
            this.mesh.EnumerateTriangleVertices ((v0, v1, v2) => {
                const v0Transformed = transformation.TransformCoord3D (v0);
                const v1Transformed = transformation.TransformCoord3D (v1);
                const v2Transformed = transformation.TransformCoord3D (v2);
                onTriangleVertices (v0Transformed, v1Transformed, v2Transformed);
            });
        }
    }

    PropertyGroupCount ()
    {
        return this.mesh.PropertyGroupCount ();
    }

    AddPropertyGroup (propertyGroup)
    {
        return this.mesh.AddPropertyGroup (propertyGroup);
    }

    GetPropertyGroup (index)
    {
        return this.mesh.GetPropertyGroup (index);
    }

    GetTransformedMesh ()
    {
        let transformation = this.node.GetWorldTransformation ();
        const transformed = OV.CloneMesh (this.mesh);
        OV.TransformMesh (transformed, transformation);
        return transformed;
    }
};
