import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { ImportO3dvFile } from '../utils/testfiles.js';
import { ModelNodesToTree } from '../utils/testutils.js';

export default function suite ()
{

describe ('O3dv Importer', function () {
    it ('translateandrotate.o3dv', function (done) {
        ImportO3dvFile ('translateandrotate.o3dv', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelNodesToTree (model), {
                name : '<Root>',
                childNodes : [
                    {
                        name : 'Translated',
                        childNodes : [
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Cube']
                            }
                        ],
                        meshNames : []
                    },
                    {
                        name : 'Rotated',
                        childNodes : [
                            {
                                name : 'Translated and Rotated',
                                childNodes : [
                                    {
                                        name : '',
                                        childNodes : [],
                                        meshNames : ['Cube']
                                    }
                                ],
                                meshNames : []
                            }
                        ],
                        meshNames : []
                    },
                    {
                        name : '',
                        childNodes : [],
                        meshNames : ['Cube']
                    }
                ],
                meshNames : []
            });

            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert.ok (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert.ok (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));

            done ();
        });
    });

    it ('solids.o3dv', function (done) {
        ImportO3dvFile ('solids.o3dv', function (model) {
            assert.ok (OV.CheckModel (model));
            assert.deepStrictEqual (ModelNodesToTree (model), {
                name : '<Root>',
                childNodes : [
                    {
                        name : 'Tetrahedral',
                        childNodes : [
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Tetrahedron']
                            }
                        ],
                        meshNames : []
                    },
                    {
                        name : 'Octahedral',
                        childNodes : [
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Hexahedron']
                            },
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Octahedron']
                            }
                        ],
                        meshNames : []
                    },                    {
                        name : 'Icosahedral',
                        childNodes : [
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Dodecahedron']
                            },
                            {
                                name : '',
                                childNodes : [],
                                meshNames : ['Icosahedron']
                            }
                        ],
                        meshNames : []
                    }
                ],
                meshNames : []
            });

            assert.strictEqual (model.MaterialCount (), 5);
            assert.strictEqual (model.MeshCount (), 5);
            assert.strictEqual (model.MeshInstanceCount (), 5);

            assert.ok (OV.IsSolid (model));
            assert.ok (OV.IsEqual (OV.CalculateVolume (model), 8.707448863695035));
            assert.ok (OV.IsEqual (OV.CalculateSurfaceArea (model), 39.636169009449105));

            assert.strictEqual (model.PropertyGroupCount (), 1);
            assert.strictEqual (model.GetPropertyGroup (0).PropertyCount (), 2);

            for (let i = 0; i < model.MeshCount (); i++) {
                let mesh = model.GetMesh (i);
                assert.strictEqual (mesh.PropertyGroupCount (), 1);
                assert.strictEqual (mesh.GetPropertyGroup (0).PropertyCount (), 5);
            }

            done ();
        });
    });
});

}
