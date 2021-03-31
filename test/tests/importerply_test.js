var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('Ply Importer', function() {
    it ('single_triangle.ply', function () {
        var model = testFiles.ImportPlyFile ('single_triangle.ply');
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
    });

    it ('two_triangles.ply', function () {
        var model = testFiles.ImportPlyFile ('two_triangles.ply');
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
    });        

    it ('single_rectangle.ply', function () {
        var model = testFiles.ImportPlyFile ('single_rectangle.ply');
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
    });
    
    it ('single_triangle_with_comments.ply', function () {
        var model = testFiles.ImportPlyFile ('single_triangle_with_comments.ply');
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
    });

    it ('cube.ply', function () {
        var model = testFiles.ImportPlyFile ('cube.ply');
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
    });

    it ('cube_meshlab_ascii.ply', function () {
        var model = testFiles.ImportPlyFile ('cube_meshlab_ascii.ply');
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
    });    

    it ('cube_meshlab_binary.ply', function () {
        var model = testFiles.ImportPlyFile ('cube_meshlab_binary.ply');
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
    });

    it ('cube_rgb_binary.ply', function () {
        var model = testFiles.ImportPlyFile ('cube_rgb_binary.ply');
        assert (OV.CheckModel (model));
        assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
            name : '',
            materials : [
                { name : '#cc0000ff' },
                { name : '#00cc00ff' },
                { name : '#0000ccff' },
                { name : '#cccccc7f' }
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
    });    
});
