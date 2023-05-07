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
        this.visibleMeshes = null;
        this.meshToVisibleMeshIndex = null;
    }

    GetModel ()
    {
        return this.model;
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

    MeshCount ()
    {
        let meshCount = 0;
        this.EnumerateMeshes ((mesh) => {
            meshCount += 1;
        });
        return meshCount;
    }

    EnumerateMeshes (onMesh)
    {
        this.FillVisibleMeshCache ();
        for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
            if (this.visibleMeshes.has (meshIndex)) {
                let mesh = this.model.GetMesh (meshIndex);
                onMesh (mesh);
            }
        }
    }

    MapMeshIndex (meshIndex)
    {
        this.FillVisibleMeshCache ();
        return this.meshToVisibleMeshIndex.get (meshIndex);
    }

    IsMeshInstanceVisible (meshInstanceId)
    {
        return this.settings.isMeshVisible (meshInstanceId);
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

    EnumerateTransformedMeshInstances (onMesh)
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
        this.EnumerateTransformedMeshInstances ((mesh) => {
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
        this.EnumerateTransformedMeshInstances ((mesh) => {
            mesh.EnumerateTriangleVertices ((v0, v1, v2) => {
                let normal = CalculateTriangleNormal (v0, v1, v2);
                onTriangle (v0, v1, v2, normal);
            });
        });
    }

    FillVisibleMeshCache ()
    {
        if (this.visibleMeshes !== null && this.meshToVisibleMeshIndex !== null) {
            return;
        }

        this.visibleMeshes = new Set ();
        this.model.EnumerateMeshInstances ((meshInstance) => {
            let meshInstanceId = meshInstance.GetId ();
            if (this.settings.isMeshVisible (meshInstanceId)) {
                this.visibleMeshes.add (meshInstanceId.meshIndex);
            }
        });

        this.meshToVisibleMeshIndex = new Map ();
        let visibleMeshIndex = 0;
        for (let meshIndex = 0; meshIndex < this.model.MeshCount (); meshIndex++) {
            if (this.visibleMeshes.has (meshIndex)) {
                this.meshToVisibleMeshIndex.set (meshIndex, visibleMeshIndex);
                visibleMeshIndex += 1;
            }
        }
    }
}
