var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('Obj Importer', function () {
    it ('single_triangle.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle.obj', function (model) {
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

    it ('two_triangles.obj', function (done) {
        testFiles.ImportObjFile ('two_triangles.obj', function (model) {
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

    it ('single_rectangle.obj', function (done) {
        testFiles.ImportObjFile ('single_rectangle.obj', function (model) {
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

    it ('single_triangle_with_comments.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle_with_comments.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MyMeshName',
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

    it ('single_triangle_negative_indices.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle_negative_indices.obj', function (model) {
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

    it ('single_triangle_with_normals_and_uvs.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle_with_normals_and_uvs.obj', function (model) {
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
                                uvs : [0, 0, 1, 0, 1, 1],
                                mat : 0
                            }
                        ]
                    }
                ]
            });
            done ();
        });
    });

    it ('single_triangle_in_mesh.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle_in_mesh.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MeshName',
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

    it ('two_triangles_in_meshes.obj', function (done) {
        testFiles.ImportObjFile ('two_triangles_in_meshes.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MeshName1',
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
                        name : 'MeshName2',
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
            done ();
        });
    });

    it ('empty_meshes.obj', function (done) {
        testFiles.ImportObjFile ('empty_meshes.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MeshName1',
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
                        name : 'MeshName2',
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
            done ();
        });
    });    

    it ('single_triangle_with_material.obj', function (done) {
        testFiles.ImportObjFile ('single_triangle_with_material.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : 'MaterialName1' },
                    { name : 'MaterialName2' }
                ],
                meshes : [
                    {
                        name : 'MeshName',
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

    it ('two_triangles_with_material.obj', function (done) {
        testFiles.ImportObjFile ('two_triangles_with_material.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : 'MaterialName1' },
                    { name : 'MaterialName2' }
                ],
                meshes : [
                    {
                        name : 'MeshName',
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
                                mat : 1
                            }                        
                        ]
                    }
                ]
            });
            done ();
        });
    });

    it ('two_meshes_same_vertices.obj', function (done) {
        testFiles.ImportObjFile ('two_meshes_same_vertices.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MeshName1',
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
                        name : 'MeshName2',
                        triangles : [
                            {
                                vertices : [0, 0, 0, 1, 0, 0, 0, 0, 1],
                                normals : [0, -1, 0, 0, -1, 0, 0, -1, 0],
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

    it ('two_meshes_with_same_name.obj', function (done) {
        testFiles.ImportObjFile ('two_meshes_with_same_name.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : 'MeshName',
                        triangles : [
                            {
                                vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [],
                                mat : 0
                            },
                            {
                                vertices : [0, 0, 0, 1, 0, 0, 0, 0, 1],
                                normals : [0, -1, 0, 0, -1, 0, 0, -1, 0],
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

    it ('rectangle_with_texture.obj', function (done) {
        testFiles.ImportObjFile ('rectangle_with_texture.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : 'Material' }
                ],
                meshes : [
                    {
                        name : 'Mesh',
                        triangles : [
                            {
                                vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [0, 0, 1, 0, 1, 1],
                                mat : 0
                            },
                            {
                                vertices : [0, 0, 0, 1, 1, 0, 0, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [0, 0, 1, 1, 0, 1],
                                mat : 0
                            }
                        ]
                    }                
                ]
            });
            done ();
        });
    });

    it ('two_materials_same_texture.obj', function (done) {
        testFiles.ImportObjFile ('two_materials_same_texture.obj', function (model) {
            assert.strictEqual (model.GetMaterial (0).diffuseMap.url, model.GetMaterial (1).diffuseMap.url);
            assert.strictEqual (model.GetMaterial (0).diffuseMap.buffer.byteLength, model.GetMaterial (1).diffuseMap.buffer.byteLength);
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObject (model), {
                name : '',
                materials : [
                    { name : 'Material1' },
                    { name : 'Material2' }
                ],
                meshes : [
                    {
                        name : 'Mesh',
                        triangles : [
                            {
                                vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [0, 0, 1, 0, 1, 1],
                                mat : 0
                            },
                            {
                                vertices : [0, 0, 0, 1, 1, 0, 0, 1, 0],
                                normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
                                uvs : [0, 0, 1, 1, 0, 1],
                                mat : 1
                            }
                        ]
                    }                
                ]
            });
            done ();
        });
    });        

    it ('cube_with_materials.obj', function (done) {
        testFiles.ImportObjFile ('cube_with_materials.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Red' },
                    { name : 'Green' },
                    { name : 'Blue' },
                    { name : 'White' },
                    { name : 'Texture' }
                ],
                meshes : [
                    {
                        name : 'Cube',
                        vertexCount : 8,
                        normalCount : 6,
                        uvCount : 4,
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

    it ('cube_rgb.obj', function (done) {
        testFiles.ImportObjFile ('cube_rgb.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Red' },
                    { name : 'Green' },
                    { name : 'Blue' },
                    { name : 'White' }
                ],
                meshes : [
                    {
                        name : 'Cube',
                        vertexCount : 8,
                        normalCount : 6,
                        uvCount : 4,
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

    it ('cube_with_materials_comments.obj', function (done) {
        testFiles.ImportObjFile ('cube_with_materials_comments.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Red' },
                    { name : 'Green' },
                    { name : 'Blue' },
                    { name : 'White' },
                    { name : 'Texture' }
                ],
                meshes : [
                    {
                        name : 'Cube',
                        vertexCount : 8,
                        normalCount : 6,
                        uvCount : 4,
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
    
    it ('cube with white spaces.obj', function (done) {
        testFiles.ImportObjFile ('cube with white spaces.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Red Color' },
                    { name : 'Green Color' },
                    { name : 'Blue Color' },
                    { name : 'White  Color' },
                    { name : 'Texture Color' }
                ],
                meshes : [
                    {
                        name : 'Cube Mesh',
                        vertexCount : 8,
                        normalCount : 6,
                        uvCount : 4,
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

    it ('icosahedron.obj', function (done) {
        testFiles.ImportObjFile ('icosahedron.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Blue' }
                ],
                meshes : [
                    {
                        name : 'Icosahedron',
                        vertexCount : 12,
                        normalCount : 20,
                        uvCount : 0,
                        triangleCount : 20,
                        boundingBox : {
                            min : [-0.85065080835204, -0.85065080835204, -0.85065080835204],
                            max : [0.85065080835204, 0.85065080835204, 0.85065080835204]
                        }
                    }
                ]
            });
            done ();
        });
    });

    it ('hundred_cubes.obj', function (done) {
        testFiles.ImportObjFile ('hundred_cubes.obj', function (model) {
            assert (OV.CheckModel (model));
            assert.strictEqual (model.MaterialCount (), 3);
            assert.strictEqual (model.MeshCount (), 100);
            done ();
        });
    });
});
