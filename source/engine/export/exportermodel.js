import { CopyObjectAttributes } from '../core/core.js';
import { Transformation } from '../geometry/transformation.js';
import { CalculateTriangleNormal, TransformMesh } from '../model/meshutils.js';

export class ExporterSettings
{
    constructor (settings)
    {
        this.transformation = new Transformation ();
        this.isMeshVisible = (meshInstanceId) => {
            return true;
        };

        CopyObjectAttributes (settings, this);
    }
}

export class ExporterModel
{
    constructor (model, settings)
    {
        this.model = model;
        this.settings = settings || new ExporterSettings ();
    }

    MaterialCount ()
    {
        return this.model.MaterialCount ();
    }

    GetMaterial (index)
    {
        return this.model.GetMaterial (index);
    }

    VertexCount ()
    {
        let vertexCount = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            vertexCount += meshInstance.VertexCount ();
        });
        return vertexCount;
    }

    TriangleCount ()
    {
        let triangleCount = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            triangleCount += meshInstance.TriangleCount ();
        });
        return triangleCount;
    }

    MeshInstanceCount ()
    {
        let meshInstanceCount = 0;
        this.EnumerateMeshInstances ((meshInstance) => {
            meshInstanceCount += 1;
        });
        return meshInstanceCount;
    }

    EnumerateMeshInstances (onMeshInstance)
    {
        this.model.EnumerateMeshInstances ((meshInstance) => {
            if (this.settings.isMeshVisible (meshInstance.GetId ())) {
                onMeshInstance (meshInstance);
            }
        });
    }

    EnumerateTransformedMeshes (onMesh)
    {
        this.EnumerateMeshInstances ((meshInstance) => {
            let transformation = meshInstance.GetTransformation ();
            if (!this.settings.transformation.IsIdentity ()) {
                transformation.Append (this.settings.transformation);
            }

            let mesh = meshInstance.GetMesh ();
            let transformed = mesh.Clone ();
            if (!transformation.IsIdentity ()) {
                TransformMesh (transformed, transformation);
            }

            onMesh (transformed);
        });
    }

    EnumerateVerticesAndTriangles (callbacks)
    {
        let transformedMeshes = [];
        this.EnumerateTransformedMeshes ((mesh) => {
            transformedMeshes.push (mesh);
        });

        for (let mesh of transformedMeshes) {
            mesh.EnumerateVertices ((vertex) => {
                callbacks.onVertex (vertex.x, vertex.y, vertex.z);
            });
        }

        let vertexOffset = 0;
        for (let mesh of transformedMeshes) {
            mesh.EnumerateTriangleVertexIndices ((v0, v1, v2) => {
                callbacks.onTriangle (v0 + vertexOffset, v1 + vertexOffset, v2 + vertexOffset);
            });
            vertexOffset += mesh.VertexCount ();
        }
    }

    EnumerateTrianglesWithNormals (onTriangle)
    {
        this.EnumerateTransformedMeshes ((mesh) => {
            mesh.EnumerateTriangleVertices ((v0, v1, v2) => {
                let normal = CalculateTriangleNormal (v0, v1, v2);
                onTriangle (v0, v1, v2, normal);
            });
        });
    }
}
