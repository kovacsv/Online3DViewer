import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { ImportOffFile } from '../utils/testfiles.js';
import { ModelToObject, ModelToObjectSimple } from '../utils/testutils.js';

export default function suite ()
{

describe ('Off Importer', function () {
    it ('single_triangle.off', function (done) {
        ImportOffFile ('single_triangle.off', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
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

    it ('two_triangles.off', function (done) {
        ImportOffFile ('two_triangles.off', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
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

    it ('single_rectangle.off', function (done) {
        ImportOffFile ('single_rectangle.off', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
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

    it ('single_triangle_with_comments.off', function (done) {
        ImportOffFile ('single_triangle_with_comments.off', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
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

    it ('cube.off', function (done) {
        ImportOffFile ('cube.off', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        vertexCount : 8,
                        vertexColorCount : 0,
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

}
