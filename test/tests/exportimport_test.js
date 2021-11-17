var assert = require ('assert');
var testUtils = require ('../utils/testutils.js');

function ExportImport (model, format, extension, onReady)
{
    let exporter = new OV.Exporter ();
    exporter.Export (model, format, extension, {
        onSuccess : function (files) {
            let fileObjects = [];
            for (let file of files) {
                fileObjects.push (new FileObject ('', file.name, file.content));
            }
            let importer = new OV.Importer ();
            let settings = new OV.ImportSettings ();
            importer.ImportFilesFromFileObjects (fileObjects, settings, {
                onFilesLoaded : function () {

                },
                onImportSuccess : function (importResult) {
                    onReady (importResult.model)
                },
                onImportError : function (importError) {

                }
            });
        }
    });
}

describe ('Export-Import Test', function () {
    it ('Obj Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Text, 'obj', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('Stl Ascii Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Text, 'stl', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('Stl Binary Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Binary, 'stl', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('Ply Ascii Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Text, 'ply', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('Ply Binary Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Binary, 'ply', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('glTF Ascii Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Text, 'gltf', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });

    it ('glTF Binary Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Binary, 'glb', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });


    it ('Off Export-Import', function (done) {
        let model = testUtils.GetTranslatedRotatedCubesModel ();
        ExportImport (model, OV.FileFormat.Text, 'off', (result) => {
            assert.strictEqual (model.MeshInstanceCount (), 3);
            let boundingBox = OV.GetBoundingBox (model);
            assert (OV.CoordIsEqual3D (boundingBox.min, new OV.Coord3D (-1.0, 0.0, 0.0)));
            assert (OV.CoordIsEqual3D (boundingBox.max, new OV.Coord3D (3.0, 3.0, 1.0)));
            done ();
        });
    });
});
