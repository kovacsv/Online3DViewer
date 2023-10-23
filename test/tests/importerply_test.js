import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { ImportPlyFile } from '../utils/testfiles.js';
import { ModelToObject, ModelToObjectSimple } from '../utils/testutils.js';

export default function suite ()
{

describe ('Ply Importer', function() {
    it ('single_triangle.ply', function (done) {
        ImportPlyFile ('single_triangle.ply', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        lines : [],
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
        ImportPlyFile ('two_triangles.ply', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        lines : [],
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
        ImportPlyFile ('single_rectangle.ply', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        lines : [],
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
        ImportPlyFile ('single_triangle_with_comments.ply', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObject (model), {
                name : '',
                materials : [
                    { name : '' }
                ],
                meshes : [
                    {
                        name : '',
                        lines : [],
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
        ImportPlyFile ('cube.ply', function (model) {
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

    it ('cube_meshlab_ascii.ply', function (done) {
        ImportPlyFile ('cube_meshlab_ascii.ply', function (model) {
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

    it ('cube_meshlab_binary.ply', function (done) {
        ImportPlyFile ('cube_meshlab_binary.ply', function (model) {
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

    it ('cube_rgb_binary.ply', function (done) {
        ImportPlyFile ('cube_rgb_binary.ply', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelToObjectSimple (model), {
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
                        vertexColorCount : 0,
                        normalCount : 12,
                        uvCount : 0,
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
});

}
