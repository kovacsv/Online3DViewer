var path = require ('path');
var testUtils = require ('./testutils.js');

global.atob = function (base64String) {
    return Buffer.from (base64String, 'base64').toString('binary');
};

global.Blob = function () {

};

var objectUrlCounter = 0;
global.URL = {
    createObjectURL : function () {
        objectUrlCounter += 1;
        return 'ObjectUrl:' + objectUrlCounter.toString ();
    },
    revokeObjectURL : function () {
        
    }
};

global.FileObject = function (folderName, fileName)
{
    this.folderName = folderName;
    this.fileName = fileName;
    this.name = path.join (folderName, fileName);
};

global.FileReader = class
{
    static DONE = 2;

    readAsText (fileObject)
    {
        let content = testUtils.GetTextFileContent (fileObject.folderName, fileObject.fileName);
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
        let content = testUtils.GetArrayBufferFileContent (fileObject.folderName, fileObject.fileName);
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
};
