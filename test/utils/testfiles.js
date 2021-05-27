var testUtils = require ('./testutils.js');

module.exports =
{
    ImportObjFile : function (fileName, onReady)
    {    
        var importer = new OV.ImporterObj ();
        this.ImportFile (importer, OV.FileFormat.Text, 'obj', fileName, onReady);
    },

    ImportStlFile : function (fileName, onReady)
    {    
        var importer = new OV.ImporterStl ();
        this.ImportFile (importer, OV.FileFormat.Binary, 'stl', fileName, onReady);
    },

    ImportOffFile : function (fileName, onReady)
    {    
        var importer = new OV.ImporterOff ();
        this.ImportFile (importer, OV.FileFormat.Text, 'off', fileName, onReady);
    },

    ImportPlyFile : function (fileName, onReady)
    {    
        var importer = new OV.ImporterPly ();
        this.ImportFile (importer, OV.FileFormat.Binary, 'ply', fileName, onReady);
    },

    Import3dsFile : function (fileName, onReady)
    {    
        var importer = new OV.Importer3ds ();
        this.ImportFile (importer, OV.FileFormat.Binary, '3ds', fileName, onReady);
    },

    ImportGltfFile : function (folderName, fileName, onReady)
    {    
        let extension = OV.GetFileExtension (fileName);
        let format = OV.FileFormat.Text;
        if (extension == 'glb') {
            format = OV.FileFormat.Binary;
        }
        var importer = new OV.ImporterGltf ();
        this.ImportFile (importer, format, 'gltf/' + folderName, fileName, onReady);
    },

    ImportO3dvFile : function (fileName, onReady)
    {    
        var importer = new OV.ImporterO3dv ();
        this.ImportFile (importer, OV.FileFormat.Text, 'o3dv', fileName, onReady);
    },

    ImportFile : function (importer, format, folder, fileName, onReady)
    {
        var content = null;
        if (format == OV.FileFormat.Text) {
            content = testUtils.GetTextFileContent (folder, fileName);
        } else if (format == OV.FileFormat.Binary) {
            content = testUtils.GetArrayBufferFileContent (folder, fileName);
        }
        var extension = OV.GetFileExtension (fileName);
        let buffers = new OV.ImportBuffers (function (filePath) {
            let extension = OV.GetFileExtension (filePath);
            let knownFormats = importer.GetKnownFileFormats ();
            let format = OV.FileFormat.Binary;
            if (knownFormats[extension] !== undefined) {
                format = knownFormats[extension];
            }
            let fileContent = null;
            if (format == OV.FileFormat.Text) {
                fileContent = testUtils.GetTextFileContent (folder, filePath);
            } else if (format == OV.FileFormat.Binary) {
                fileContent = testUtils.GetArrayBufferFileContent (folder, filePath);
            }
            return fileContent;
        });
        importer.Import (content, extension, {
            getDefaultMaterial : function () {
                var material = new OV.Material ();
                return material;
            },
            getFileBuffer : function (filePath) {
                return buffers.GetFileBuffer (filePath);
            },
            getTextureBuffer : function (filePath) {
                return buffers.GetTextureBuffer (filePath);
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
