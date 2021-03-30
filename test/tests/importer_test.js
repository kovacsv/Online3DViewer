var assert = require ('assert');
var path = require ('path');

function ImportFilesWithImporter (importer, files, callbacks)
{
    importer.LoadFilesFromFileObjects (files, function () {
        importer.Import ({
            success : function (importResult) {
                callbacks.success (importer, importResult);
            },
            error : function (importError) {
                callbacks.error (importer, importError);
            }
        });
    });
}

function ImportFiles (files, callbacks)
{
    let importer = new OV.Importer ();
    ImportFilesWithImporter (importer, files, callbacks);
}

describe ('Importer Test', function () {
	it ('Empty File List', function () {
        let files = [];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.NoImportableFile);
            }
        });
	});

	it ('Not existing file', function () {
        let files = [
            new FileObject ('obj', 'missing.obj')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.NoImportableFile);
            }
        });
	});

	it ('Not imprtable file', function () {
        let files = [
            new FileObject ('', 'wrong.ext')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.NoImportableFile);
            }
        });
	});

	it ('Wrong file', function () {
        let files = [
            new FileObject ('3ds', 'wrong.3ds')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert.fail ();
            },
            error : function (importer, importError) {
                assert.strictEqual (importError.code, OV.ImportErrorCode.ImportFailed);
            }
        });
	});

    it ('Single file', function () {
        let files = [
            new FileObject ('obj', 'single_triangle.obj')
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['single_triangle.obj']);
                assert.deepStrictEqual (importResult.missingFiles, []);
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
	});

    it ('Missing files', function () {
        let files = [];
        files.push (new FileObject ('obj', 'cube_with_materials.obj'));
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj']);
                assert.deepStrictEqual (importResult.missingFiles, ['cube_with_materials.mtl']);
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
        files.push (new FileObject ('obj', 'cube_with_materials.mtl'));
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl']);
                assert.deepStrictEqual (importResult.missingFiles, ['cube_texture.png']);
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
        files.push (new FileObject ('obj', 'cube_texture.png'));
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                assert.deepStrictEqual (importResult.missingFiles, []);
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
	});

    it ('Missing texture multiple times', function () {
        let files = [
            new FileObject ('obj', 'two_materials_same_texture.obj'),
            new FileObject ('obj', 'two_materials_same_texture.mtl'),
        ];
        ImportFiles (files, {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['two_materials_same_texture.obj', 'two_materials_same_texture.mtl']);
                assert.deepStrictEqual (importResult.missingFiles, ['texture.png']);
            },
            error : function (importer, importError) {
                assert.fail ();
            }
        });
	});

    it ('Append Missing files', function () {
        let theImporter = new OV.Importer ();
        ImportFilesWithImporter (theImporter, [new FileObject ('obj', 'cube_with_materials.obj')], {
            success : function (importer, importResult) {
                assert (!OV.IsModelEmpty (importResult.model));
                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj']);
                assert.deepStrictEqual (importResult.missingFiles, ['cube_with_materials.mtl']);
                ImportFilesWithImporter (theImporter, [new FileObject ('obj', 'cube_with_materials.mtl')], {
                    success : function (importer, importResult) {
                        assert (!OV.IsModelEmpty (importResult.model));
                        assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl']);
                        assert.deepStrictEqual (importResult.missingFiles, ['cube_texture.png']);
                        ImportFilesWithImporter (theImporter, [new FileObject ('obj', 'cube_texture.png')], {
                            success : function (importer, importResult) {
                                assert (!OV.IsModelEmpty (importResult.model));
                                assert.deepStrictEqual (importResult.usedFiles, ['cube_with_materials.obj', 'cube_with_materials.mtl', 'cube_texture.png']);
                                assert.deepStrictEqual (importResult.missingFiles, []);
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
});
