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

global.FileObject = function (folderName, fileName, fileContent)
{
    this.name = path.join (folderName, fileName);
    this.folderName = folderName;
    this.fileName = fileName;
    this.fileContent = null;
    if (fileContent !== undefined) {
        this.fileContent = fileContent;
    }
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
        if (fileObject.fileContent !== null) {
            this.onloadend ({
                target : {
                    readyState : FileReader.DONE,
                    result : fileObject.fileContent
                }
            });
            return;
        }

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

global.document = {
    head : {
        appendChild : function (element) {
            if (element.type === 'text/javascript') {
                if (element.src.indexOf ('draco') !== -1) {
                    global.DracoDecoderModule = require (element.src);
                    element.onload ();
                } else if (element.src.indexOf ('fflate') !== -1) {
                    global.fflate = require (element.src);
                    element.onload ();
                } else {
                    element.onerror ();
                }
            }
        }
    },
    createElement : function (type) {
        return {
            type : type
        };
    }
};
