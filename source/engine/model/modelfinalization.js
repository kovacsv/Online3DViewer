import { CopyObjectAttributes } from '../core/core.js';
import { AddCoord3D, Coord3D, CoordIsEqual3D } from '../geometry/coord3d.js';
import { Color } from './color.js';
import { PhongMaterial } from './material.js';
import { CalculateTriangleNormal, GetMeshType, MeshType } from './meshutils.js';

export class ModelFinalizer
{
    constructor (params)
    {
        this.params = {
            getDefaultMaterialColor : () => {
                return new Color (0, 0, 0);
            }
        };
        CopyObjectAttributes (params, this.params);
        this.defaultMaterialIndex = null;
    }

    Finalize (model)
    {
        this.Reset ();

        this.FinalizeMeshes (model);
        this.FinalizeMaterials (model);
        this.FinalizeNodes (model);
    }

    FinalizeMaterials (model)
    {
        let hasVertexColors = (model.VertexColorCount () > 0);
        if (!hasVertexColors) {
            return;
        }

        let materialHasVertexColors = new Map ();
        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
                let triangle = mesh.GetTriangle (triangleIndex);
                let hasVertexColors = triangle.HasVertexColors ();
                if (!materialHasVertexColors.has (triangle.mat)) {
                    materialHasVertexColors.set (triangle.mat, hasVertexColors);
                } else if (!hasVertexColors) {
                    materialHasVertexColors.set (triangle.mat, false);
                }
            }
        }

        for (let [materialIndex, hasVertexColors] of materialHasVertexColors) {
            let material = model.GetMaterial (materialIndex);
            material.vertexColors = hasVertexColors;
        }
    }

    FinalizeMeshes (model)
    {
        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            let type = GetMeshType (mesh);
            if (type === MeshType.Empty) {
                model.RemoveMesh (meshIndex);
                meshIndex = meshIndex - 1;
                continue;
            }
            this.FinalizeMesh (model, mesh);
        }
    }

    FinalizeMesh (model, mesh)
    {
        function CalculateCurveNormals (mesh)
        {
            function AddAverageNormal (mesh, triangle, vertexIndex, triangleNormals, vertexToTriangles)
            {
                function IsNormalInArray (array, normal)
                {
                    for (let i = 0; i < array.length; i++) {
                        let current = array[i];
                        if (CoordIsEqual3D (current, normal)) {
                            return true;
                        }
                    }
                    return false;
                }

                let averageNormals = [];
                let neigTriangles = vertexToTriangles.get (vertexIndex);
                for (let i = 0; i < neigTriangles.length; i++) {
                    let neigIndex = neigTriangles[i];
                    let neigTriangle = mesh.GetTriangle (neigIndex);
                    if (triangle.curve === neigTriangle.curve) {
                        let triangleNormal = triangleNormals[neigIndex];
                        if (!IsNormalInArray (averageNormals, triangleNormal)) {
                            averageNormals.push (triangleNormal);
                        }
                    }
                }

                let averageNormal = new Coord3D (0.0, 0.0, 0.0);
                for (let i = 0; i < averageNormals.length; i++) {
                    averageNormal = AddCoord3D (averageNormal, averageNormals[i]);
                }
                averageNormal.MultiplyScalar (1.0 / averageNormals.length);
                averageNormal.Normalize ();
                return mesh.AddNormal (averageNormal);
            }

            let triangleNormals = [];
            let vertexToTriangles = new Map ();

            for (let vertexIndex = 0; vertexIndex < mesh.VertexCount (); vertexIndex++) {
                vertexToTriangles.set (vertexIndex, []);
            }

            for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
                let triangle = mesh.GetTriangle (triangleIndex);
                let v0 = mesh.GetVertex (triangle.v0);
                let v1 = mesh.GetVertex (triangle.v1);
                let v2 = mesh.GetVertex (triangle.v2);
                let normal = CalculateTriangleNormal (v0, v1, v2);
                triangleNormals.push (normal);
                vertexToTriangles.get (triangle.v0).push (triangleIndex);
                vertexToTriangles.get (triangle.v1).push (triangleIndex);
                vertexToTriangles.get (triangle.v2).push (triangleIndex);
            }

            for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
                let triangle = mesh.GetTriangle (triangleIndex);
                if (!triangle.HasNormals ()) {
                    let n0 = AddAverageNormal (mesh, triangle, triangle.v0, triangleNormals, vertexToTriangles);
                    let n1 = AddAverageNormal (mesh, triangle, triangle.v1, triangleNormals, vertexToTriangles);
                    let n2 = AddAverageNormal (mesh, triangle, triangle.v2, triangleNormals, vertexToTriangles);
                    triangle.SetNormals (n0, n1, n2);
                }
            }
        }

        let meshStatus = {
            calculateCurveNormals : false
        };

        for (let i = 0; i < mesh.TriangleCount (); i++) {
            let triangle = mesh.GetTriangle (i);
            this.FinalizeTriangle (mesh, triangle, meshStatus);

            if (triangle.mat === null) {
                triangle.mat = this.GetDefaultMaterialIndex (model);
            }
        }

        if (meshStatus.calculateCurveNormals) {
            CalculateCurveNormals (mesh);
        }
    }

    FinalizeTriangle (mesh, triangle, meshStatus)
    {
        if (!triangle.HasNormals ()) {
            if (triangle.curve === null || triangle.curve === 0) {
                let v0 = mesh.GetVertex (triangle.v0);
                let v1 = mesh.GetVertex (triangle.v1);
                let v2 = mesh.GetVertex (triangle.v2);
                let normal = CalculateTriangleNormal (v0, v1, v2);
                let normalIndex = mesh.AddNormal (normal);
                triangle.SetNormals (normalIndex, normalIndex, normalIndex);
            } else {
                meshStatus.calculateCurveNormals = true;
            }
        }

        if (triangle.curve === null) {
            triangle.curve = 0;
        }
    }

    FinalizeNodes (model)
    {
        let rootNode = model.GetRootNode ();

        let emptyNodes = [];
        rootNode.EnumerateChildren ((node) => {
            if (node.IsEmpty ()) {
                emptyNodes.push (node);
            }
        });

        for (let nodeIndex = 0; nodeIndex < emptyNodes.length; nodeIndex++) {
            let node = emptyNodes[nodeIndex];
            let parentNode = node.GetParent ();
            if (parentNode === null) {
                continue;
            }
            parentNode.RemoveChildNode (node);
            if (parentNode.IsEmpty ()) {
                emptyNodes.push (parentNode);
            }
        }
    }

    GetDefaultMaterialIndex (model)
    {
        if (this.defaultMaterialIndex === null) {
            let defaultMaterialColor = this.params.getDefaultMaterialColor ();
            let defaultMaterial = new PhongMaterial ();
            defaultMaterial.color = defaultMaterialColor;
            defaultMaterial.isDefault = true;
            this.defaultMaterialIndex = model.AddMaterial (defaultMaterial);
        }
        return this.defaultMaterialIndex;
    }

    Reset ()
    {
        this.defaultMaterialIndex = null;
    }
}

export function FinalizeModel (model, params)
{
    let finalizer = new ModelFinalizer (params);
    finalizer.Finalize (model);
}

export function CheckModel (model)
{
    function IsCorrectValue (val)
    {
        if (val === undefined || val === null) {
            return false;
        }
        return true;
    }

    function IsCorrectNumber (val)
    {
        if (!IsCorrectValue (val)) {
            return false;
        }
        if (isNaN (val)) {
            return false;
        }
        return true;
    }

    function IsCorrectIndex (val, count)
    {
        if (!IsCorrectNumber (val)) {
            return false;
        }
        if (val < 0 || val >= count) {
            return false;
        }
        return true;
    }

    function CheckMesh (model, mesh)
    {
        function CheckTriangle (model, mesh, triangle)
        {
            if (!IsCorrectIndex (triangle.v0, mesh.VertexCount ())) {
                return false;
            }
            if (!IsCorrectIndex (triangle.v1, mesh.VertexCount ())) {
                return false;
            }
            if (!IsCorrectIndex (triangle.v2, mesh.VertexCount ())) {
                return false;
            }
            if (triangle.HasVertexColors ()) {
                if (!IsCorrectIndex (triangle.c0, mesh.VertexColorCount ())) {
                    return false;
                }
                if (!IsCorrectIndex (triangle.c1, mesh.VertexColorCount ())) {
                    return false;
                }
                if (!IsCorrectIndex (triangle.c2, mesh.VertexColorCount ())) {
                    return false;
                }
            }
            if (!IsCorrectIndex (triangle.n0, mesh.NormalCount ())) {
                return false;
            }
            if (!IsCorrectIndex (triangle.n1, mesh.NormalCount ())) {
                return false;
            }
            if (!IsCorrectIndex (triangle.n2, mesh.NormalCount ())) {
                return false;
            }
            if (triangle.HasTextureUVs ()) {
                if (!IsCorrectIndex (triangle.u0, mesh.TextureUVCount ())) {
                    return false;
                }
                    if (!IsCorrectIndex (triangle.u1, mesh.TextureUVCount ())) {
                    return false;
                }
                if (!IsCorrectIndex (triangle.u2, mesh.TextureUVCount ())) {
                    return false;
                }
            }
            if (!IsCorrectIndex (triangle.mat, model.MaterialCount ())) {
                return false;
            }
            if (!IsCorrectNumber (triangle.curve)) {
                return false;
            }

            return true;
        }

        for (let i = 0; i < mesh.VertexCount (); i++) {
            let vertex = mesh.GetVertex (i);
            if (!IsCorrectNumber (vertex.x)) {
                return false;
            }
            if (!IsCorrectNumber (vertex.y)) {
                return false;
            }
            if (!IsCorrectNumber (vertex.z)) {
                return false;
            }
        }

        for (let i = 0; i < mesh.VertexColorCount (); i++) {
            let color = mesh.GetVertexColor (i);
            if (!IsCorrectNumber (color.r)) {
                return false;
            }
            if (!IsCorrectNumber (color.g)) {
                return false;
            }
            if (!IsCorrectNumber (color.b)) {
                return false;
            }
        }

        for (let i = 0; i < mesh.NormalCount (); i++) {
            let normal = mesh.GetNormal (i);
            if (!IsCorrectNumber (normal.x)) {
                return false;
            }
            if (!IsCorrectNumber (normal.y)) {
                return false;
            }
            if (!IsCorrectNumber (normal.z)) {
                return false;
            }
        }

        for (let i = 0; i < mesh.TextureUVCount (); i++) {
            let uv = mesh.GetTextureUV (i);
            if (!IsCorrectNumber (uv.x)) {
                return false;
            }
            if (!IsCorrectNumber (uv.y)) {
                return false;
            }
        }

        for (let i = 0; i < mesh.TriangleCount (); i++) {
            let triangle = mesh.GetTriangle (i);
            if (!CheckTriangle (model, mesh, triangle)) {
                return false;
            }
        }

        return true;
    }

    for (let i = 0; i < model.MeshCount (); i++) {
        let mesh = model.GetMesh (i);
        if (!CheckMesh (model, mesh)) {
            return false;
        }
    }

    return true;
}
