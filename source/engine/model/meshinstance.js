import { TransformMesh } from './meshutils.js';
import { ModelObject3D } from './object.js';

export class MeshInstanceId
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
}

export class MeshInstance extends ModelObject3D
{
    constructor (id, node, mesh)
    {
        super ();
        this.id = id;
        this.node = node;
        this.mesh = mesh;
    }

    GetId ()
    {
        return this.id;
    }

    GetTransformation ()
    {
        return this.node.GetWorldTransformation ();
    }

    GetMesh ()
    {
        return this.mesh;
    }

    VertexCount ()
    {
        return this.mesh.VertexCount ();
    }

    VertexColorCount ()
    {
        return this.mesh.VertexColorCount ();
    }

    NormalCount ()
    {
        return this.mesh.NormalCount ();
    }

    TextureUVCount ()
    {
        return this.mesh.TextureUVCount ();
    }

    LineCount ()
    {
        return this.mesh.LineCount ();
    }

    LineSegmentCount ()
    {
        return this.mesh.LineSegmentCount ();
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
        let transformed = this.mesh.Clone ();
        TransformMesh (transformed, transformation);
        return transformed;
    }
}
