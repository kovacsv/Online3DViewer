var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('O3dv Importer', function () {
    it ('cube.o3dv', function (done) {
        testFiles.ImportO3dvFile ('cube.o3dv', function (model) {
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

    it ('cube_with_material.o3dv', function (done) {
        testFiles.ImportO3dvFile ('cube_with_material.o3dv', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Material' }
                ],
                meshes : [
                    {
                        name : 'Cube',
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

    it ('cube_transformation.o3dv', function (done) {
        testFiles.ImportO3dvFile ('cube_transformation.o3dv', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Material 1' },
                    { name : 'Material 2' },
                    { name : 'Material 3' },
                    { name : 'Material 4' }
                ],
                meshes : [
                    {
                        name : 'Cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    },
                    {
                        name : 'Cube T',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 0, 0],
                            max : [3, 1, 1]
                        }
                    },
                    {
                        name : 'Cube TR',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [3.2928932188134525, 0, 0],
                            max : [4.707106781186548, 1.414213562373095, 1]
                        }
                    },
                    {
                        name : 'Cube TRS',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [4.585786437626905, 0, 0],
                            max : [7.060660171779821, 2.4748737341529163, 2.5]
                        }
                    }                    
                ]
            });
            done ();
        });
    });  
});
