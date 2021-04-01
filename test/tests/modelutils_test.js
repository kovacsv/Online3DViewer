var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

describe ('Model Utils', function () {
    it ('Create Merged Model', function () {
        var model = new OV.Model ();
        
        var mesh1 = new OV.Mesh ();
        mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh1.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh1.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh1);

        var mesh2 = new OV.Mesh ();
        mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
        mesh2.AddVertex (new OV.Coord3D (1.0, 1.0, 1.0));
        mesh2.AddTriangle (new OV.Triangle (0, 1, 2));
        model.AddMesh (mesh2);

        OV.FinalizeModel (model, function () { return new OV.Material (); });
        assert.deepStrictEqual (testUtils.ModelToObject (model), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                },
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }
                    ]
                }
            ]
        });

        var mergedModel = OV.CreateMergedModel (model);
        assert.deepStrictEqual (testUtils.ModelToObject (mergedModel), {
            name : '',
            materials : [
                { name : '' }
            ],
            meshes : [
                {
                    name : '',
                    triangles : [
                        {
                            vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        },
                        {
                            vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
                            normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                            uvs : [],
                            mat : 0
                        }                        
                    ]
                }
            ]
        });        
    });
});
