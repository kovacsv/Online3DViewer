var fs = require ('fs');
var path = require ('path');

module.exports =
{
    GetTextFileContent : function (folder, fileName)
    {
        var testFilePath = path.join ('testfiles', folder, fileName);
        if (!fs.existsSync (testFilePath)) {
            return null;
        }
        return fs.readFileSync (testFilePath).toString ();
    },

    GetArrayBufferFileContent : function (folder, fileName)
    {
        var testFilePath = path.join ('testfiles', folder, fileName);
        var buffer = fs.readFileSync (testFilePath);
        var arrayBuffer = new ArrayBuffer (buffer.length);
        var uint8Array = new Uint8Array (arrayBuffer);
        var i;
        for (i = 0; i < buffer.length; ++i) {
            uint8Array[i] = buffer[i];
        }
        return arrayBuffer        
    },

    ModelToObject : function (model)
    {
        var obj = {
            name : model.GetName (),
            materials : [],
            meshes : []
        };

        var i, j;

        var material;
        for (i = 0; i < model.MaterialCount (); i++) {
            material = model.GetMaterial (i);
            obj.materials.push ({
                name : material.name
            });
        }

        var mesh, triangle, meshObj, triangleObj;
        for (i = 0; i < model.MeshCount (); i++) {
            mesh = model.GetMesh (i);
            meshObj = {
                name : mesh.GetName (),
                triangles : []
            };
            for (j = 0; j < mesh.TriangleCount (); j++) {
                triangle = mesh.GetTriangle (j);
                triangleObj = {
                    mat : triangle.mat,
                    vertices : [],
                    normals : [],
                    uvs : []
                };
                triangleObj.vertices.push (
                    mesh.GetVertex (triangle.v0).x,
                    mesh.GetVertex (triangle.v0).y,
                    mesh.GetVertex (triangle.v0).z,
                    mesh.GetVertex (triangle.v1).x,
                    mesh.GetVertex (triangle.v1).y,
                    mesh.GetVertex (triangle.v1).z,
                    mesh.GetVertex (triangle.v2).x,
                    mesh.GetVertex (triangle.v2).y,
                    mesh.GetVertex (triangle.v2).z
                );
                triangleObj.normals.push (
                    mesh.GetNormal (triangle.n0).x,
                    mesh.GetNormal (triangle.n0).y,
                    mesh.GetNormal (triangle.n0).z,
                    mesh.GetNormal (triangle.n1).x,
                    mesh.GetNormal (triangle.n1).y,
                    mesh.GetNormal (triangle.n1).z,
                    mesh.GetNormal (triangle.n2).x,
                    mesh.GetNormal (triangle.n2).y,
                    mesh.GetNormal (triangle.n2).z
                );
                if (triangle.HasTextureUVs ()) {
                    triangleObj.uvs.push (
                        mesh.GetTextureUV (triangle.u0).x,
                        mesh.GetTextureUV (triangle.u0).y,
                        mesh.GetTextureUV (triangle.u1).x,
                        mesh.GetTextureUV (triangle.u1).y,
                        mesh.GetTextureUV (triangle.u2).x,
                        mesh.GetTextureUV (triangle.u2).y
                    );                
                }
                meshObj.triangles.push (triangleObj);
            }
            obj.meshes.push (meshObj);
        }

        return obj;
    },

    ModelToObjectSimple : function (model)
    {
        var obj = {
            name : model.GetName (),
            materials : [],
            meshes : []
        };

        var i;

        var material;
        for (i = 0; i < model.MaterialCount (); i++) {
            material = model.GetMaterial (i);
            obj.materials.push ({
                name : material.name
            });
        }

        var mesh, meshObj, boundingBox;
        for (i = 0; i < model.MeshCount (); i++) {
            mesh = model.GetMesh (i);
            boundingBox = OV.GetBoundingBox (mesh);
            meshObj = {
                name : mesh.GetName (),
                vertexCount : mesh.VertexCount (),
                normalCount : mesh.NormalCount (),
                uvCount : mesh.TextureUVCount (),
                triangleCount : mesh.TriangleCount (),
                boundingBox : {
                    min : [boundingBox.min.x, boundingBox.min.y, boundingBox.min.z],
                    max : [boundingBox.max.x, boundingBox.max.y, boundingBox.max.z]
                }
            };
            obj.meshes.push (meshObj);
        }

        return obj;
    },

    GetTwoCubesConnectingInOneVertexModel ()
    {
        let model = new OV.Model ();

        let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        model.AddMesh (cube1);
        
        let matrix = new OV.Matrix ().CreateTranslation (1.0, 1.0, 1.0);
        let cube2 = OV.GenerateCuboid (new OV.GeneratorParams ().SetTransformationMatrix (matrix), 1.0, 1.0, 1.0);
        model.AddMesh (cube2);

        OV.FinalizeModel (model, function () { new OV.Material () });
        return model;
    },

    GetTwoCubesConnectingInOneEdgeModel ()
    {
        let model = new OV.Model ();

        let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        model.AddMesh (cube1);
        
        let matrix = new OV.Matrix ().CreateTranslation (1.0, 0.0, 1.0);
        let cube2 = OV.GenerateCuboid (new OV.GeneratorParams ().SetTransformationMatrix (matrix), 1.0, 1.0, 1.0);
        model.AddMesh (cube2);

        OV.FinalizeModel (model, function () { new OV.Material () });
        return model;
    },


    GetTwoCubesConnectingInOneFaceModel ()
    {
        let model = new OV.Model ();

        let cube1 = OV.GenerateCuboid (null, 1.0, 1.0, 1.0);
        model.AddMesh (cube1);
        
        let matrix = new OV.Matrix ().CreateTranslation (1.0, 0.0, 0.0);
        let cube2 = OV.GenerateCuboid (new OV.GeneratorParams ().SetTransformationMatrix (matrix), 1.0, 1.0, 1.0);
        model.AddMesh (cube2);

        OV.FinalizeModel (model, function () { new OV.Material () });
        return model;
    },
    
    GetCubeWithOneMissingFaceMesh ()
    {
        var cube = new OV.Mesh ();
        cube.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        cube.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        cube.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        cube.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
        cube.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        cube.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        cube.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        cube.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
        cube.AddTriangle (new OV.Triangle (0, 1, 5));
        cube.AddTriangle (new OV.Triangle (0, 5, 4));
        cube.AddTriangle (new OV.Triangle (1, 2, 6));
        cube.AddTriangle (new OV.Triangle (1, 6, 5));
        cube.AddTriangle (new OV.Triangle (2, 3, 7));
        cube.AddTriangle (new OV.Triangle (2, 7, 6));
        cube.AddTriangle (new OV.Triangle (3, 0, 4));
        cube.AddTriangle (new OV.Triangle (3, 4, 7));
        cube.AddTriangle (new OV.Triangle (0, 3, 2));
        cube.AddTriangle (new OV.Triangle (0, 2, 1));
        return cube;
    },    

    GetTetrahedronMesh ()
    {
        var tetrahedron = new OV.Mesh ();
        
        let a = 1.0;
        tetrahedron.AddVertex (new OV.Coord3D (+a, +a, +a));
        tetrahedron.AddVertex (new OV.Coord3D (-a, -a, +a));
        tetrahedron.AddVertex (new OV.Coord3D (-a, +a, -a));
        tetrahedron.AddVertex (new OV.Coord3D (+a, -a, -a));
        tetrahedron.AddTriangle (new OV.Triangle (0, 1, 3));
        tetrahedron.AddTriangle (new OV.Triangle (0, 2, 1));
        tetrahedron.AddTriangle (new OV.Triangle (0, 3, 2));
        tetrahedron.AddTriangle (new OV.Triangle (1, 2, 3));

        return tetrahedron;
    },    

    GetModelWithOneMesh (mesh)
    {
        var model = new OV.Model ();
        model.AddMesh (mesh);
        OV.FinalizeModel (model, function () { new OV.Material () });
        return model;
    } 
}
