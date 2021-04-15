var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('3ds Importer', function() {
    it ('cube_with_materials.3ds', function (done) {
        testFiles.Import3dsFile ('cube_with_materials.3ds', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'tex' },
                    { name : 'red' },
                    { name : 'green' },
                    { name : 'blue' },
                    { name : 'white' }
                ],
                meshes : [
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
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

    it ('cube_with_texture_transformations.3ds', function (done) {
        testFiles.Import3dsFile ('cube_with_texture_transformations.3ds', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'tex' },
                    { name : 'red' },
                    { name : 'green' },
                    { name : 'blue' },
                    { name : 'white' }
                ],
                meshes : [
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
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

    it ('cube_two_instances.3ds', function (done) {
        testFiles.Import3dsFile ('cube_two_instances.3ds', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'tex' },
                    { name : 'red' },
                    { name : 'green' },
                    { name : 'blue' },
                    { name : 'white' }
                ],
                meshes : [
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 0, 0],
                            max : [3, 1, 1]
                        }
                    }                
                ]
            });
            done ();
        });
    });

    it ('cube_four_instances.3ds', function (done) {
        testFiles.Import3dsFile ('cube_four_instances.3ds', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'tex' },
                    { name : 'red' },
                    { name : 'green' },
                    { name : 'blue' },
                    { name : 'white' }
                ],
                meshes : [
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 0, 0],
                            max : [3, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 2, 0],
                            max : [3, 3, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        normalCount : 12,
                        uvCount : 8,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 2, 0],
                            max : [1, 3, 1]
                        }
                    }                
                ]
            });
            done ();
        });
    });        
});
