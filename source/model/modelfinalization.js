OV.FinalizeModel = function (model, getDefaultMaterial)
{
    function FinalizeMesh (mesh, getDefaultMaterialIndex)
    {
        function CalculateCurveNormals (mesh)
        {
            function AddAverageNormal (mesh, triangle, vertexIndex, triangleNormals, vertexToTriangles)
            {
                function IsNormalInArray (array, normal)
                {
                    for (let i = 0; i < array.length; i++) {
                        let current = array[i];
                        if (OV.CoordIsEqual3D (current, normal)) {
                            return true;
                        }                        
                    }
                    return false;
                }

                let averageNormals = [];
                let neigTriangles = vertexToTriangles[vertexIndex];
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

                let averageNormal = new OV.Coord3D (0.0, 0.0, 0.0);
                for (let i = 0; i < averageNormals.length; i++) {
                    averageNormal = OV.AddCoord3D (averageNormal, averageNormals[i]);
                }
                averageNormal.MultiplyScalar (1.0 / averageNormals.length);
                averageNormal.Normalize ();
                return mesh.AddNormal (averageNormal);
            }

            let triangleNormals = [];
            let vertexToTriangles = {};
        
            for (let vertexIndex = 0; vertexIndex < mesh.VertexCount (); vertexIndex++) {
                vertexToTriangles[vertexIndex] = [];
            }
            
            for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
                let triangle = mesh.GetTriangle (triangleIndex);
                let v0 = mesh.GetVertex (triangle.v0);
                let v1 = mesh.GetVertex (triangle.v1);
                let v2 = mesh.GetVertex (triangle.v2);
                let normal = OV.CalculateTriangleNormal (v0, v1, v2);
                triangleNormals.push (normal);
                vertexToTriangles[triangle.v0].push (triangleIndex);
                vertexToTriangles[triangle.v1].push (triangleIndex);
                vertexToTriangles[triangle.v2].push (triangleIndex);
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

        function FinalizeTriangle (mesh, triangle, status)
        {
            if (!triangle.HasNormals ()) {
                if (triangle.curve === null || triangle.curve === 0) {
                    let v0 = mesh.GetVertex (triangle.v0);
                    let v1 = mesh.GetVertex (triangle.v1);
                    let v2 = mesh.GetVertex (triangle.v2);
                    let normal = OV.CalculateTriangleNormal (v0, v1, v2);
                    let normalIndex = mesh.AddNormal (normal);
                    triangle.SetNormals (normalIndex, normalIndex, normalIndex);
                } else {
                    status.calculateCurveNormals = true;
                }
            }
            if (triangle.mat === null) {
                triangle.mat = status.getDefaultMaterialIndex ();
            }
            if (triangle.curve === null) {
                triangle.curve = 0;
            }
        }
        
        let status = {
            getDefaultMaterialIndex : getDefaultMaterialIndex,
            calculateCurveNormals : false
        };

        for (let i = 0; i < mesh.TriangleCount (); i++) {
            let triangle = mesh.GetTriangle (i);
            FinalizeTriangle (mesh, triangle, status);
        }

        if (status.calculateCurveNormals) {
            CalculateCurveNormals (mesh);
        }
    }

    let defaultMaterialIndex = null;
    let getDefaultMaterialIndex = function () {
        if (defaultMaterialIndex === null) {
            let defaultMaterial = getDefaultMaterial ();
            defaultMaterial.isDefault = true;
            defaultMaterialIndex = model.AddMaterial (defaultMaterial);
        }
        return defaultMaterialIndex;
    };

    for (let i = 0; i < model.MeshCount (); i++) {
        let mesh = model.GetMesh (i);
        if (mesh.TriangleCount () === 0) {
            model.RemoveMesh (i);
            i = i - 1;
            continue;
        }
        FinalizeMesh (mesh, getDefaultMaterialIndex);
    }
};

OV.CheckModel = function (model)
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
};
