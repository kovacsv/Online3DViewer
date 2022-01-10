import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

function ImportFilesWithImporter (importer, files, callbacks)
{
    let settings = new OV.ImportSettings ();
    importer.ImportFiles (files, OV.FileSource.File, settings, {
        onFilesLoaded : function () {

        },
        onImportSuccess : function (importResult) {
            callbacks.success (importer, importResult);
        },
        onImportError : function (importError) {
            callbacks.error (importer, importError);
        }
    });
}

function ImportFiles (files, callbacks)
{
    let importer = new OV.Importer ();
    ImportFilesWithImporter (importer, files, callbacks);
}

describe ('Importer Test', function () {
    it ('Empty File List', function (done) {
        let files = [];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.NoImportableFile);
                done ();
            }
        });
    });

    it ('Not existing file', function (done) {
        let files = [
            new FileObject ('', 'obj/missing.obj')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.FailedToLoadFile);
                done ();
            }
        });
    });

    it ('Not importable file', function (done) {
        let files = [
            new FileObject ('', 'wrong.ext')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.NoImportableFile);
                done ();
            }
        });
    });

    it ('Wrong file', function (done) {
        let files = [
            new FileObject ('', '3ds/wrong.3ds')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.ImportFailed);
                done ();
            }
        });
    });

    it ('Single file', function (done) {
        let files = [
            new FileObject ('', 'obj/single_triangle.obj')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['single_triangle.obj']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Multiple files', function (done) {
        let files = [
            new FileObject ('', 'obj/cube_with_materials.obj'),
            new FileObject ('', 'obj/cube_with_materials.mtl'),
            new FileObject ('', 'obj/cube_texture.png')
        ]

        let theImporter = new OV.Importer ();
        ImportFilesWithImporter (theImporter, files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Missing files', function (done) {
        let files = [];
        files.push (new FileObject ('', 'obj/cube_with_materials.obj'));
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj']);
                assert.deepStrictEqual (importResult.missingFiles, ['cube_with_materials.mtl']);
                files.push (new FileObject ('', 'obj/cube_with_materials.mtl'));
                ImportFiles (files, {
                    success : function (importer, importResult) {
                        assert.ok (!OV.IsModelEmpty (importResult.model));
                        assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl']);
                        assert.deepStrictEqual (importResult.missingFiles, ['cube_texture.png']);
                        files.push (new FileObject ('', 'obj/cube_texture.png'));
                        ImportFiles (files, {
                            success : function (importer, importResult) {
                                assert.ok (!OV.IsModelEmpty (importResult.model));
                                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                                assert.deepStrictEqual (importResult.missingFiles, []);
                                done ();
                            },
                            error : function (importer, importError) {
                                assert.fail ();
                            }
                        });
                    },
                    error : function (importer, importError) {
                        assert.fail ();
                    }
                });
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });

    });

    it ('Missing texture multiple times', function (done) {
        let files = [
            new FileObject ('', 'obj/two_materials_same_texture.obj'),
            new FileObject ('', 'obj/two_materials_same_texture.mtl'),
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['two_materials_same_texture.obj', 'two_materials_same_texture.mtl']);
                assert.deepStrictEqual (importResult.missingFiles, ['texture.png']);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Append Missing files', function (done) {
        let theImporter = new OV.Importer ();
        ImportFilesWithImporter (theImporter, [new FileObject ('', 'obj/cube_with_materials.obj')], {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj']);
                assert.deepStrictEqual (importResult.missingFiles, ['cube_with_materials.mtl']);
                ImportFilesWithImporter (theImporter, [new FileObject ('', 'obj/cube_with_materials.mtl')], {
                    success : function (importer, importResult) {
                        assert.ok (!OV.IsModelEmpty (importResult.model));
                        assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl']);
                        assert.deepStrictEqual (importResult.missingFiles, ['cube_texture.png']);
                        ImportFilesWithImporter (theImporter, [new FileObject ('', 'obj/cube_texture.png')], {
                            success : function (importer, importResult) {
                                assert.ok (!OV.IsModelEmpty (importResult.model));
                                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                                assert.deepStrictEqual (importResult.missingFiles, []);
                                done ();
                            },
                            error : function (importer, importError) {
                                assert.fail ();
                            }
                        });
                    },
                    error : function (importer, importError) {
                        assert.fail ();
                    }
                });
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Reuse importer', function (done) {
        let files1 = [
            new FileObject ('', 'obj/cube_with_materials.obj'),
            new FileObject ('', 'obj/cube_with_materials.mtl'),
            new FileObject ('', 'obj/cube_texture.png')
        ]
        let files2 = [
            new FileObject ('', 'obj/single_triangle.obj')
        ];

        let theImporter = new OV.Importer ();
        ImportFilesWithImporter (theImporter, files1, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);

                ImportFilesWithImporter (theImporter, files2, {
                    success : function (importer, importResult) {
                        assert.ok (!OV.IsModelEmpty (importResult.model));
                        assert.deepStrictEqual (importResult.usedFiles, ['single_triangle.obj']);
                        assert.deepStrictEqual (importResult.missingFiles, []);
                        done ();
                    },
                    error : function (importer, importError) {
                        assert.fail ();
                    }
                });
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Default color', function (done) {
        let files = [
            new FileObject ('', 'stl/single_triangle.stl')
        ];
        let theImporter = new OV.Importer ();
        let settings = new OV.ImportSettings ();
        settings.defaultColor = new OV.Color (200, 0, 0);
        theImporter.ImportFiles (files, OV.FileSource.File, settings, {
            onFilesLoaded : function () {

            },
            onImportSuccess : function (importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['single_triangle.stl']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                let material = importResult.model.GetMaterial (0);
                assert.deepStrictEqual (material.color, new OV.Color (200, 0, 0));
                done ();
            },
            onImportError : function (importError) {
                assert.fail ();
            }
        });
    });

    it ('Zip file', function (done) {
        let files = [
            new FileObject ('', 'zip/cube_four_instances.zip')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_four_instances.3ds', 'texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Zip file with Folders', function (done) {
        let files = [
            new FileObject ('', 'zip/cube_four_instances_folders.zip')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_four_instances.3ds', 'texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });

    it ('Multiple Zip Files', function (done) {
        let files = [
            new FileObject ('', 'zip/cube_with_materials_notexture.zip'),
            new FileObject ('', 'zip/textures.zip')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.ok (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);
                done ();
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
    });
});

}
