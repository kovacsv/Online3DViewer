var fs = require ('fs');

require ('../../build/final/website/o3dv/o3dv.min.js');

let importer = new OV.Importer ();

let FileObject = function (name)
{
    this.name = name;
};

let files = [
    new FileObject ('cube_meshlab_ascii.stl')
];

global.FileReader = class
{
    static DONE = 2;

    readAsText (fileObject)
    {
        let content = fs.readFileSync (fileObject.name).toString ();
        if (content !== null) {
            this.onloadend ({
                target : {
                    readyState : FileReader.DONE,
                    result : content
                }
            });
        } else {
            this.onerror ();
        }
    }

    readAsArrayBuffer (fileObject)
    {
        let content = fs.readFileSync (fileObject.name);
        if (content !== null) {
            var arrayBuffer = new ArrayBuffer (content.length);
            var uint8Array = new Uint8Array (arrayBuffer);
            for (let i = 0; i < content.length; ++i) {
                uint8Array[i] = content[i];
            }
            this.onloadend ({
                target : {
                    readyState : FileReader.DONE,
                    result : arrayBuffer
                }
            });
        } else {
            this.onerror ();
        }
    }
};

let settings = new OV.ImportSettings ();
importer.ImportFiles (files, OV.FileSource.File, settings, {
    onFilesLoaded : function () {

    },
    onImportSuccess : function (importResult) {
        console.log (importResult);
    },
    onImportError : function (importError) {
        console.log (importError);
    }
});
