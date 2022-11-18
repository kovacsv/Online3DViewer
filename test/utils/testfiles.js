import * as OV from '../../source/engine/main.js';
import { GetArrayBufferFileContent } from './testutils.js';
import * as path from 'path';

export function ImportFile (importer, folder, fileName, onReady)
{
    let content = GetArrayBufferFileContent (path.join (folder, fileName));
    var extension = OV.GetFileExtension (fileName);
    let fileAccessor = new OV.ImporterFileAccessor (function (filePath) {
        let fileContent = GetArrayBufferFileContent (path.join (folder, filePath));
        return fileContent;
    });
    importer.Import (fileName, extension, content, {
        getDefaultMaterialColor () {
            return new OV.RGBColor (0, 0, 0);
        },
        getFileBuffer : function (filePath) {
            return fileAccessor.GetFileBuffer (filePath);
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

export function ImportObjFile (fileName, onReady)
{
    var importer = new OV.ImporterObj ();
    ImportFile (importer, 'obj', fileName, onReady);
}

export function ImportStlFile (fileName, onReady)
{
    var importer = new OV.ImporterStl ();
    ImportFile (importer, 'stl', fileName, onReady);
}

export function ImportOffFile (fileName, onReady)
{
    var importer = new OV.ImporterOff ();
    ImportFile (importer, 'off', fileName, onReady);
}

export function ImportPlyFile (fileName, onReady)
{
    var importer = new OV.ImporterPly ();
    ImportFile (importer, 'ply', fileName, onReady);
}

export function Import3dsFile (fileName, onReady)
{
    var importer = new OV.Importer3ds ();
    ImportFile (importer, '3ds', fileName, onReady);
}

export function ImportGltfFile (folderName, fileName, onReady)
{
    var importer = new OV.ImporterGltf ();
    ImportFile (importer, 'gltf/' + folderName, fileName, onReady);
}
