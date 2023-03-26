import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { ImportGltfFile } from '../utils/testfiles.js';
import { ModelNodesToTree, ModelToObjectSimple } from '../utils/testutils.js';

export default function suite ()
{

//const util = require('util')
//console.log (util.inspect(testUtils.ModelToObjectSimple (model), {showHidden: false, depth: null}))

describe ('Gltf Importer', function () {
    it ('Triangle', function (done) {
        let testFileList = [
            ['Triangle/glTF', 'Triangle.gltf'],
            ['Triangle/glTF-Embedded', 'Triangle.gltf'],
            ['TriangleWithoutIndices/glTF', 'TriangleWithoutIndices.gltf'],
            ['TriangleWithoutIndices/glTF-Embedded', 'TriangleWithoutIndices.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : '',
                            childNodes : [],
                            meshNames : ['']
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : '',
                            vertexCount : 3,
                            vertexColorCount : 0,
                            normalCount : 1,
                            uvCount : 0,
                            triangleCount : 1,
                            boundingBox : {
                                min : [0.0, 0.0, 0.0],
                                max : [1.0, 1.0, 0.0]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('Box', function (done) {
        let testFileList = [
            ['Box/glTF', 'Box.gltf'],
            ['Box/glTF-Embedded', 'Box.gltf'],
            ['Box/glTF-Binary', 'Box.glb'],
            ['Box/glTF-Draco', 'Box.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : '',
                            childNodes : [
                                {
                                    name : '',
                                    childNodes : [],
                                    meshNames : ['Mesh']
                                }
                            ],
                            meshNames : []
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : 'Red' }
                    ],
                    meshes : [
                        {
                            name : 'Mesh',
                            vertexCount : 24,
                            vertexColorCount : 0,
                            normalCount : 24,
                            uvCount : 0,
                            triangleCount : 12,
                            boundingBox : {
                                min : [-0.5, -0.5, -0.5],
                                max : [0.5, 0.5, 0.5]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('BoxVertexColors', function (done) {
        let testFileList = [
            ['BoxVertexColors/glTF', 'BoxVertexColors.gltf'],
            ['BoxVertexColors/glTF-Embedded', 'BoxVertexColors.gltf'],
            ['BoxVertexColors/glTF-Binary', 'BoxVertexColors.glb']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : 'RootNode',
                            childNodes : [
                                {
                                    name : 'Cube',
                                    childNodes : [],
                                    meshNames : ['Cube']
                                }
                            ],
                            meshNames : []
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : 'Default' }
                    ],
                    meshes : [
                        {
                            name : 'Cube',
                            vertexCount : 24,
                            vertexColorCount : 24,
                            normalCount : 24,
                            uvCount : 24,
                            triangleCount : 12,
                            boundingBox : {
                                min : [-0.5, -0.5, -0.5],
                                max : [0.5, 0.5, 0.5]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('BoxInterleaved', function (done) {
        let testFileList = [
            ['BoxInterleaved/glTF', 'BoxInterleaved.gltf'],
            ['BoxInterleaved/glTF-Embedded', 'BoxInterleaved.gltf'],
            ['BoxInterleaved/glTF-Binary', 'BoxInterleaved.glb']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : '',
                            childNodes : [
                                {
                                name : '',
                                childNodes : [],
                                meshNames : ['Mesh']
                                }
                            ],
                            meshNames : []
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : 'Mesh',
                            vertexCount : 24,
                            vertexColorCount : 0,
                            normalCount : 24,
                            uvCount : 0,
                            triangleCount : 12,
                            boundingBox : {
                                min : [-0.5, -0.5, -0.5],
                                max : [0.5, 0.5, 0.5]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('BoxTextured', function (done) {
        let testFileList = [
            ['BoxTextured/glTF', 'BoxTextured.gltf'],
            ['BoxTextured/glTF-Embedded', 'BoxTextured.gltf'],
            ['BoxTextured/glTF-Binary', 'BoxTextured.glb']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : '',
                            childNodes : [
                                {
                                name : '',
                                childNodes : [],
                                meshNames : ['Mesh']
                                }
                            ],
                            meshNames : []
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : 'Texture' }
                    ],
                    meshes : [
                        {
                            name : 'Mesh',
                            vertexCount : 24,
                            vertexColorCount : 0,
                            normalCount : 24,
                            uvCount : 24,
                            triangleCount : 12,
                            boundingBox : {
                                min : [-0.5, -0.5, -0.5],
                                max : [0.5, 0.5, 0.5]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('SimpleMeshes', function (done) {
        let testFileList = [
            ['SimpleMeshes/glTF', 'SimpleMeshes.gltf'],
            ['SimpleMeshes/glTF-Embedded', 'SimpleMeshes.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelNodesToTree (model), {
                    name : '<Root>',
                    childNodes : [
                        {
                            name : '',
                            childNodes : [],
                            meshNames : ['']
                        },
                        {
                            name : '',
                            childNodes : [],
                            meshNames : ['']
                        }
                    ],
                    meshNames : []
                });
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : '',
                            vertexCount : 3,
                            vertexColorCount : 0,
                            normalCount : 3,
                            uvCount : 0,
                            triangleCount : 1,
                            boundingBox : {
                                min : [0.0, 0.0, 0.0],
                                max : [1.0, 1.0, 0.0]
                            }
                        },
                        {
                            name : '',
                            vertexCount : 3,
                            vertexColorCount : 0,
                            normalCount : 3,
                            uvCount : 0,
                            triangleCount : 1,
                            boundingBox : {
                                min : [1.0, 0.0, 0.0],
                                max : [2.0, 1.0, 0.0]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('OrientationTest', function (done) {
        let testFileList = [
            ['OrientationTest/glTF', 'OrientationTest.gltf'],
            ['OrientationTest/glTF-Embedded', 'OrientationTest.gltf'],
            ['OrientationTest/glTF-Binary', 'OrientationTest.glb'],
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : 'BaseMaterial' },
                        { name : 'MatX1' },
                        { name : 'MatX2' },
                        { name : 'MatY1' },
                        { name : 'MatY2' },
                        { name : 'MatZ1' },
                        { name : 'MatZ2' }
                    ],
                    meshes : [
                        {
                            name: 'ArrowMeshZ2',
                            vertexCount: 78,
                            vertexColorCount: 0,
                            normalCount: 78,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ -0.6921195564310951, -1.0785199551363698, -5.330651201963446 ],
                                max: [ 1.0439303242310798, 2.868914373727357, -4.66934876823423 ]
                            }
                        },
                        {
                            name: 'TargetMeshZ2',
                            vertexCount: 50,
                            vertexColorCount: 0,
                            normalCount: 50,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ 0.8097413778305054, 2.8717148303985596, -5.33065128326416 ],
                                max: [ 1.4936277866363525, 3.9211390018463135, -4.66934871673584 ]
                            }
                        },
                        {
                            name: 'TargetMeshY2',
                            vertexCount: 50,
                            vertexColorCount: 0,
                            normalCount: 50,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ -1.1686336994171143, -5.330650806427002, 2.93727445602417 ],
                                max: [ -0.46912679076194763, -4.66934871673584, 3.9916374683380127 ]
                            }
                        },
                        {
                            name: 'ArrowMeshY2',
                            vertexCount: 78,
                            vertexColorCount: 0,
                            normalCount: 78,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ -0.9557393651589479, -5.330651177643153, -1.06505742884149 ],
                                max: [ 0.6167901044859734, -4.6693486435429055, 2.934442924096579 ]
                            }
                        },
                        {
                            name: 'ArrowMeshX2',
                            vertexCount: 78,
                            vertexColorCount: 0,
                            normalCount: 78,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ -5.330651171390089, -1.0326269494863676, -0.6059335185163844 ],
                                max: [ -4.669348828609911, 2.9885841671721116, 0.8202131194767724 ]
                            }
                        },
                        {
                            name: 'TargetMeshX2',
                            vertexCount: 54,
                            vertexColorCount: 0,
                            normalCount: 54,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ -5.33065128326416, 2.991360902786255, -0.012430161237716675 ],
                                max: [ -4.66934871673584, 4.039160251617432, 0.6999828815460205 ]
                            }
                        },
                        {
                            name: 'TargetMeshZ1',
                            vertexCount: 52,
                            vertexColorCount: 0,
                            normalCount: 52,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ -1.3648574352264404, 2.9005930423736572, 4.66934871673584 ],
                                max: [ -0.6740907430648804, 3.9529545307159424, 5.33065128326416 ]
                            }
                        },
                        {
                            name: 'ArrowMeshZ1',
                            vertexCount: 74,
                            vertexColorCount: 0,
                            normalCount: 74,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ -1.009571011381568, -1.074115497823536, 4.669348895549774 ],
                                max: [ 0.6625885973069405, 2.8977772707193465, 5.330651104450226 ]
                            }
                        },
                        {
                            name: 'TargetMeshX1',
                            vertexCount: 54,
                            vertexColorCount: 0,
                            normalCount: 54,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ 4.66934871673584, 2.4595587253570557, -2.553251266479492 ],
                                max: [ 5.33065128326416, 3.432579517364502, -1.7226401567459106 ]
                            }
                        },
                        {
                            name: 'ArrowMeshX1',
                            vertexCount: 78,
                            vertexColorCount: 0,
                            normalCount: 78,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ 4.669348835945129, -1.0589144181932033, -1.7207290818192755 ],
                                max: [ 5.330651164054871, 2.4574561383341145, 0.9159925616542917 ]
                            }
                        },
                        {
                            name: 'TargetMeshY1',
                            vertexCount: 52,
                            vertexColorCount: 0,
                            normalCount: 52,
                            uvCount: 0,
                            triangleCount: 26,
                            boundingBox : {
                                min: [ 2.8218495845794678, 4.669349193572998, -1.6833229064941406 ],
                                max: [ 3.864471435546875, 5.33065128326416, -1.0113166570663452 ]
                            }
                        },
                        {
                            name: 'ArrowMeshY1',
                            vertexCount: 78,
                            vertexColorCount: 0,
                            normalCount: 78,
                            uvCount: 0,
                            triangleCount: 38,
                            boundingBox : {
                                min: [ -1.0826615032554154, 4.669348806142807, -1.093071740019906 ],
                                max: [ 2.8190779754834807, 5.3306513130664825, 0.7348238365226794 ]
                            }
                        },
                        {
                            name: 'BaseCubeMesh',
                            vertexCount: 272,
                            vertexColorCount: 0,
                            normalCount: 272,
                            uvCount: 0,
                            triangleCount: 140,
                            boundingBox : {
                                min: [ -5.000001907348633, -5, -5.000001907348633 ],
                                max: [ 5.000002384185791, 5, 5.000002861022949 ]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('MeshPrimitives_4Vertex', function (done) {
        let testFileList = [
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_04.gltf'],
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_05.gltf'],
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_11.gltf'],
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_12.gltf'],
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_13.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : '',
                            vertexCount : 4,
                            vertexColorCount : 0,
                            normalCount : 2,
                            uvCount : 0,
                            triangleCount : 2,
                            boundingBox : {
                                min : [-0.5, -0.5, 0.0],
                                max : [0.5, 0.5, 0.0]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('MeshPrimitives_6Vertex', function (done) {
        let testFileList = [
            ['Mesh_PrimitiveMode', 'Mesh_PrimitiveMode_06.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : '',
                            vertexCount : 6,
                            vertexColorCount : 0,
                            normalCount : 2,
                            uvCount : 0,
                            triangleCount : 2,
                            boundingBox : {
                                min : [-0.5, -0.5, 0.0],
                                max : [0.5, 0.5, 0.0]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('SimpleSparseAccessor', function (done) {
        let testFileList = [
            ['SimpleSparseAccessor/glTF', 'SimpleSparseAccessor.gltf'],
            ['SimpleSparseAccessor/glTF-Embedded', 'SimpleSparseAccessor.gltf']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.deepStrictEqual (ModelToObjectSimple (model), {
                    name : '',
                    materials : [
                        { name : '' }
                    ],
                    meshes : [
                        {
                            name : '',
                            vertexCount : 14,
                            vertexColorCount : 0,
                            normalCount : 12,
                            uvCount : 0,
                            triangleCount : 12,
                            boundingBox : {
                                min : [0.0, 0.0, 0.0],
                                max : [6.0, 4.0, 0.0]
                            }
                        }
                    ]
                });
                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('Properties', function (done) {
        let testFileList = [
            ['Properties', 'properties.gltf'],
            ['Properties', 'properties.glb']
        ];
        let processed = 0;
        for (let i = 0; i < testFileList.length; i++) {
            let testFile = testFileList[i];
            ImportGltfFile (testFile[0], testFile[1], function (model) {
                assert.ok (OV.CheckModel (model));
                assert.equal (model.PropertyGroupCount (), 2);
                assert.equal (model.GetPropertyGroup (0).PropertyCount (), 2);
                assert.equal (model.GetPropertyGroup (1).PropertyCount (), 3);

                let firstMesh = model.GetMesh (0);
                assert.equal (firstMesh.PropertyGroupCount (), 2);
                assert.equal (firstMesh.GetPropertyGroup (0).PropertyCount (), 2);
                assert.equal (firstMesh.GetPropertyGroup (1).PropertyCount (), 2);

                processed += 1;
                if (processed == testFileList.length) {
                    done ();
                }
            });
        }
    });

    it ('CubeHierarchy', function (done) {
        let testFile = ['CubeHierarchy', 'CubeHierarchy.gltf']
        ImportGltfFile (testFile[0], testFile[1], function (model) {
            assert.ok (OV.CheckModel (model));
            assert.strictEqual (model.MeshCount (), 3);
            assert.strictEqual (model.MeshInstanceCount (), 4);
            assert.deepStrictEqual (ModelNodesToTree (model), {
                name : '<Root>',
                childNodes : [
                    {
                        name : 'Parent node 1',
                        childNodes : [
                            {
                                name : 'Child node 1',
                                childNodes : [
                                    {
                                        name : '',
                                        childNodes : [],
                                        meshNames : ['Green cube']
                                    }
                                ],
                                meshNames : []
                            },
                            {
                                name : 'Child node 2',
                                childNodes : [
                                    {
                                        name : '',
                                        childNodes : [],
                                        meshNames : ['Blue cube']
                                    }
                                ],
                                meshNames : []
                            },
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Red cube']
                            }
                        ],
                        meshNames : []
                    },
                    {
                        name : 'Parent node 2',
                        childNodes : [
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Red cube']
                            }
                        ],
                        meshNames : []
                    }
                ],
                meshNames : []
            });

            done ();
        });
    });
});

}
