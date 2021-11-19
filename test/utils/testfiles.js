var testUtils = require ('./testutils.js');

module.exports =
{
    ImportObjFile : function (fileName, onReady)
    {
        var importer = new OV.ImporterObj ();
        this.ImportFile (importer, 'obj', fileName, onReady);
    },

    ImportStlFile : function (fileName, onReady)
    {
        var importer = new OV.ImporterStl ();
        this.ImportFile (importer, 'stl', fileName, onReady);
    },

    ImportOffFile : function (fileName, onReady)
    {
        var importer = new OV.ImporterOff ();
        this.ImportFile (importer, 'off', fileName, onReady);
    },

    ImportPlyFile : function (fileName, onReady)
    {
        var importer = new OV.ImporterPly ();
        this.ImportFile (importer, 'ply', fileName, onReady);
    },

    Import3dsFile : function (fileName, onReady)
    {
        var importer = new OV.Importer3ds ();
        this.ImportFile (importer, '3ds', fileName, onReady);
    },

    ImportGltfFile : function (folderName, fileName, onReady)
    {
        var importer = new OV.ImporterGltf ();
        this.ImportFile (importer, 'gltf/' + folderName, fileName, onReady);
    },

    ImportO3dvFile : function (fileName, onReady)
    {
        var importer = new OV.ImporterO3dv ();
        this.ImportFile (importer, 'o3dv', fileName, onReady);
    },

    ImportFile : function (importer, folder, fileName, onReady)
    {
        let content = testUtils.GetArrayBufferFileContent (folder, fileName);
        var extension = OV.GetFileExtension (fileName);
        let fileAccessor = new OV.ImporterFileAccessor (function (filePath) {
            let fileContent = testUtils.GetArrayBufferFileContent (folder, filePath);
            return fileContent;
        });
        importer.Import (fileName, extension, content, {
            getDefaultMaterial : function () {
                var material = new OV.Material (OV.MaterialType.Phong);
                return material;
            },
            getFileBuffer : function (filePath) {
                return fileAccessor.GetFileBuffer (filePath);
            },
            getTextureBuffer : function (filePath) {
                return fileAccessor.GetTextureBuffer (filePath);
            },
            onSuccess : function () {
                let model = importer.GetModel ();
                onReady (model);
            },
            onError : function () {
                onReady (model);
            },
            onComplete : function () {

            }
        });
    }
}
