import * as path from 'path';
import { GetArrayBufferFileContent, GetTextFileContent } from './testutils.js';

export function SetGlobals ()
{
    global.atob = function (base64String) {
        return Buffer.from (base64String, 'base64').toString('binary');
    };

    global.Blob = function () {

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
            if (fileObject.fileContent !== null) {
                this.onloadend ({
                    target : {
                        readyState : FileReader.DONE,
                        result : fileObject.fileContent
                    }
                });
                return;
            }

            let content = GetTextFileContent (fileObject.fileName);
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

            let content = GetArrayBufferFileContent (fileObject.fileName);
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
                    element.onerror ();
                }
            }
        },
        createElement : function (type) {
            return {
                type : type
            };
        }
    };
}
