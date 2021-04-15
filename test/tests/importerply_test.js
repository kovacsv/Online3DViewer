var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('Ply Importer', function() {
    it ('single_triangle.ply', function (done) {
        var model = testFiles.ImportPlyFile ('single_triangle.ply', function (model) {
            assert (OV.CheckModel (model));
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
                    }
                ]
            });
            done ();
        });
    });

    it ('two_triangles.ply', function (done) {
        var model = testFiles.ImportPlyFile ('two_triangles.ply', function (model) {
            assert (OV.CheckModel (model));
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
            done ();
        });
    });        

    it ('single_rectangle.ply', function (done) {
        var model = testFiles.ImportPlyFile ('single_rectangle.ply', function (model) {
            assert (OV.CheckModel (model));
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
                            },
                            {
                                vertices : [0, 0, 0, 1, 1, 0, 0, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [],
                                mat : 0
                            }                        
                        ]
                    }
                ]
            });
            done ();
        });
    });
    
    it ('single_triangle_with_comments.ply', function (done) {
        var model = testFiles.ImportPlyFile ('single_triangle_with_comments.ply', function (model) {
            assert (OV.CheckModel (model));
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
                    }
                ]
            });
            done ();
        });
    });

    it ('cube.ply', function (done) {
        var model = testFiles.ImportPlyFile ('cube.ply', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    }
                ]
            });
            done ();
        });
    });

    it ('cube_meshlab_ascii.ply', function (done) {
        var model = testFiles.ImportPlyFile ('cube_meshlab_ascii.ply', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    }
                ]
            });
            done ();
        });
    });    

    it ('cube_meshlab_binary.ply', function (done) {
        var model = testFiles.ImportPlyFile ('cube_meshlab_binary.ply', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    }
                ]
            });
            done ();
        });
    });

    it ('cube_rgb_binary.ply', function (done) {
        var model = testFiles.ImportPlyFile ('cube_rgb_binary.ply', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Color cc0000ff' },
                    { name : 'Color 00cc00ff' },
                    { name : 'Color 0000ccff' },
                    { name : 'Color cccccc7f' }
                ],
                meshes : [
                    {
                        name : '',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    }
                ]
            });
            done ();
        });
    });    
});
