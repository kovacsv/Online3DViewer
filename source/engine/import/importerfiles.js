import { RunTasks } from '../core/taskrunner.js';
import { FileSource, GetFileExtension, GetFileName, ReadFile, RequestUrl } from '../io/fileutils.js';

/**
 * File representation class for importers.
 */
export class InputFile
{
    /**
     * @param {string} name Name of the file.
     * @param {FileSource} source Source of the file.
     * @param {string|File} data If the file source is url, this must be the url string. If the file source
     * is file, this must be a {@link File} object.
     */
    constructor (name, source, data)
    {
        this.name = name;
        this.source = source;
        this.data = data;
    }
}

export function InputFilesFromUrls (urls)
{
    let inputFiles = [];
    for (let url of urls) {
        let fileName = GetFileName (url);
        inputFiles.push (new InputFile (fileName, FileSource.Url, url));
    }
    return inputFiles;
}

export function InputFilesFromFileObjects (fileObjects)
{
    let inputFiles = [];
    for (let fileObject of fileObjects) {
        let fileName = GetFileName (fileObject.name);
        inputFiles.push (new InputFile (fileName, FileSource.File, fileObject));
    }
    return inputFiles;
}

export class ImporterFile
{
    constructor (name, source, data)
    {
        this.name = GetFileName (name);
        this.extension = GetFileExtension (name);
        this.source = source;
        this.data = data;
        this.content = null;
    }

    SetContent (content)
    {
        this.content = content;
    }
}

export class ImporterFileList
{
    constructor ()
    {
        this.files = [];
    }

    FillFromInputFiles (inputFiles)
    {
        this.files = [];
        for (let inputFile of inputFiles) {
            let file = new ImporterFile (inputFile.name, inputFile.source, inputFile.data);
            this.files.push (file);
        }
    }

    ExtendFromFileList (fileList)
    {
        let files = fileList.GetFiles ();
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

    GetContent (callbacks)
    {
        RunTasks (this.files.length, {
            runTask : (index, onTaskComplete) => {
                callbacks.onFileListProgress (index, this.files.length);
                this.GetFileContent (this.files[index], {
                    onReady : onTaskComplete,
                    onProgress : callbacks.onFileLoadProgress
                });
            },
            onReady : callbacks.onReady
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

    AddFile (file)
    {
        this.files.push (file);
    }

    GetFileContent (file, callbacks)
    {
        if (file.content !== null) {
            callbacks.onReady ();
            return;
        }
        let loaderPromise = null;
        if (file.source === FileSource.Url) {
            loaderPromise = RequestUrl (file.data, callbacks.onProgress);
        } else if (file.source === FileSource.File) {
            loaderPromise = ReadFile (file.data, callbacks.onProgress);
        } else {
            callbacks.onReady ();
            return;
        }
        loaderPromise.then ((content) => {
            file.SetContent (content);
        }).catch (() => {
        }).finally (() => {
            callbacks.onReady ();
        });
    }
}
