import { RunTasks } from '../core/taskrunner.js';
import { FileFormat, FileSource, GetFileExtension, GetFileName, ReadFile, RequestUrl } from '../io/fileutils.js';

export class File
{
    constructor (file, source)
    {
        this.source = source;
        if (source === FileSource.Url) {
            this.fileUrl = file;
            this.fileObject = null;
            this.name = GetFileName (file);
            this.extension = GetFileExtension (file);
        } else if (source === FileSource.File) {
            this.fileUrl = null;
            this.fileObject = file;
            this.name = GetFileName (file.name);
            this.extension = GetFileExtension (file.name);
        } else if (source === FileSource.Decompressed) {
            this.fileUrl = null;
            this.fileObject = null;
            this.name = GetFileName (file);
            this.extension = GetFileExtension (file);
        }
        this.content = null;
    }

    SetContent (content)
    {
        this.content = content;
    }
}

export class FileList
{
    constructor ()
    {
        this.files = [];
    }

    FillFromFileUrls (fileList)
    {
        this.Fill (fileList, FileSource.Url);
    }

    FillFromFileObjects (fileList)
    {
        this.Fill (fileList, FileSource.File);
    }

    ExtendFromFileList (files)
    {
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (!this.ContainsFileByPath (file.name)) {
                this.files.push (file);
            }
        }
    }

    GetFiles ()
    {
        return this.files;
    }

    GetContent (onReady)
    {
        RunTasks (this.files.length, {
            runTask : (index, complete) => {
                this.GetFileContent (this.files[index], complete);
            },
            onReady : onReady
        });
    }

    ContainsFileByPath (filePath)
    {
        return this.FindFileByPath (filePath) !== null;
    }

    FindFileByPath (filePath)
    {
        let fileName = GetFileName (filePath).toLowerCase ();
        for (let fileIndex = 0; fileIndex < this.files.length; fileIndex++) {
            let file = this.files[fileIndex];
            if (file.name.toLowerCase () === fileName) {
                return file;
            }
        }
        return null;
    }

    IsOnlyUrlSource ()
    {
        if (this.files.length === 0) {
            return false;
        }
        for (let i = 0; i < this.files.length; i++) {
            let file = this.files[i];
            if (file.source !== FileSource.Url && file.source !== FileSource.Decompressed) {
                return false;
            }
        }
        return true;
    }

    Fill (fileList, fileSource)
    {
        this.files = [];
        for (let fileIndex = 0; fileIndex < fileList.length; fileIndex++) {
            let fileObject = fileList[fileIndex];
            let file = new File (fileObject, fileSource);
            this.AddFile (file);
        }
    }

    AddFile (file)
    {
        this.files.push (file);
    }

    GetFileContent (file, complete)
    {
        if (file.content !== null) {
            complete ();
            return;
        }
        let loaderPromise = null;
        if (file.source === FileSource.Url) {
            loaderPromise = RequestUrl (file.fileUrl, FileFormat.Binary);
        } else if (file.source === FileSource.File) {
            loaderPromise = ReadFile (file.fileObject, FileFormat.Binary);
        } else {
            complete ();
            return;
        }
        loaderPromise.then ((content) => {
            file.SetContent (content);
        }).catch (() => {
        }).finally (() => {
            complete ();
        });
    }
}
