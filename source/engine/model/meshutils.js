import { Coord3D, CrossVector3D, SubCoord3D } from '../geometry/coord3d.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';

export const MeshType =
{
    Empty : 0,
    TriangleMesh : 1
};

export function GetMeshType (mesh)
{
    if (mesh.TriangleCount () > 0) {
        return MeshType.TriangleMesh;
    }
    return MeshType.Empty;
}

export function CalculateTriangleNormal (v0, v1, v2)
{
    let v = SubCoord3D (v1, v0);
    let w = SubCoord3D (v2, v0);
    let normal = CrossVector3D (v, w);
    normal.Normalize ();
    return normal;
}

export function TransformMesh (mesh, transformation)
{
    if (transformation.IsIdentity ()) {
        return;
    }

    for (let i = 0; i < mesh.VertexCount (); i++) {
        let vertex = mesh.GetVertex (i);
        let transformed = transformation.TransformCoord3D (vertex);
        vertex.x = transformed.x;
        vertex.y = transformed.y;
        vertex.z = transformed.z;
    }

    if (mesh.NormalCount () > 0) {
        let trs = transformation.GetMatrix ().DecomposeTRS ();
        let normalMatrix = new Matrix ().ComposeTRS (new Coord3D (0.0, 0.0, 0.0), trs.rotation, new Coord3D (1.0, 1.0, 1.0));
        let normalTransformation = new Transformation (normalMatrix);
        for (let i = 0; i < mesh.NormalCount (); i++) {
            let normal = mesh.GetNormal (i);
            let transformed = normalTransformation.TransformCoord3D (normal);
            normal.x = transformed.x;
            normal.y = transformed.y;
            normal.z = transformed.z;
        }
    }
}

export function FlipMeshTrianglesOrientation (mesh)
{
    for (let i = 0; i < mesh.TriangleCount (); i++) {
        let triangle = mesh.GetTriangle (i);
        let tmp = triangle.v1;
        triangle.v1 = triangle.v2;
        triangle.v2 = tmp;
    }
}
