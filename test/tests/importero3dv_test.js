var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('O3dv Importer', function () {
    it ('translateandrotate.o3dv', function (done) {
        testFiles.ImportO3dvFile ('translateandrotate.o3dv', function (model) {
            assert (OV.CheckModel (model));
            assert.deepStrictEqual (testUtils.ModelNodesToTree (model), {
                name : '<Root>',
                childNodes : [
                    {
                        name : 'Translated',
                        childNodes : [],
                        meshNames : ['Cube']
                    },
                    {
                        name : 'Rotated',
                        childNodes : [
                            {
                                name : 'Translated and Rotated',
                                childNodes : [],
                                meshNames : ['Cube']
                            }
                        ],
                        meshNames : []
                    }
                ],
                meshNames : ['Cube']
            });

            assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : 'Green' }
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

            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));

            done ();
        });
    });
});
