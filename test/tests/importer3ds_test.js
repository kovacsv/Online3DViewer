import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { Import3dsFile } from '../utils/testfiles.js';
import { ModelToObjectSimple } from '../utils/testutils.js';

export default function suite ()
{

describe ('3ds Importer', function() {
    it ('cube_with_materials.3ds', function (done) {
        Import3dsFile ('cube_with_materials.3ds', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
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
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
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
        Import3dsFile ('cube_with_texture_transformations.3ds', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
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
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
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
        Import3dsFile ('cube_two_instances.3ds', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
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
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
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
        Import3dsFile ('cube_four_instances.3ds', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
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
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [0, 0, 0],
                            max : [1, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 0, 0],
                            max : [3, 1, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
                        triangleCount : 12,
                        boundingBox : {
                            min : [2, 2, 0],
                            max : [3, 3, 1]
                        }
                    },
                    {
                        name : 'cube',
                        vertexCount : 8,
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 8,
                        lineCount : 0,
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

    it ('cube_hierarchy.3ds', function (done) {
        Import3dsFile ('cube_hierarchy.3ds', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
                name: '',
                materials: [ { name: 'c_tex' }, { name: 'c_red' }, { name: 'c_blue' } ],
                meshes: [
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ -1, -1, -1 ], max: [ 1, 1, 1 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ 2, -1, -1 ], max: [ 4, 1, 1 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ 2, 2, -1 ], max: [ 4, 4, 1 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ -1, 2, -1 ], max: [ 1, 4, 1 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ -1, -1, 2 ], max: [ 1, 1, 4 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ 2, -1, 2 ], max: [ 4, 1, 4 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ 2, 2, 2 ], max: [ 4, 4, 4 ] }
                    },
                    {
                        name: 'Cube',
                        vertexCount: 8,
                        vertexColorCount: 0,
                        normalCount: 12,
                        uvCount: 8,
                        lineCount : 0,
                        triangleCount: 12,
                        boundingBox: { min: [ -1, 2, 2 ], max: [ 1, 4, 4 ] }
                    }
                ]
            });
            done ();
        });
    });
});

}
