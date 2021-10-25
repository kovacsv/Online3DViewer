OV.File = class
{
    constructor (file, source)
    {
        this.source = source;
        if (source === OV.FileSource.Url) {
            this.fileUrl = file;
            this.fileObject = null;
            this.name = OV.GetFileName (file);
            this.extension = OV.GetFileExtension (file);
        } else if (source === OV.FileSource.File) {
            this.fileUrl = null;
            this.fileObject = file;
            this.name = OV.GetFileName (file.name);
            this.extension = OV.GetFileExtension (file.name);
        } else if (source === OV.FileSource.Decompressed) {
            this.fileUrl = null;
            this.fileObject = null;
            this.name = OV.GetFileName (file);
            this.extension = OV.GetFileExtension (file);
        }
        this.content = null;
    }

    SetContent (content)
    {
        this.content = content;
    }
};

OV.FileList = class
{
    constructor ()
    {
        this.files = [];
    }

    FillFromFileUrls (fileList)
    {
        this.Fill (fileList, OV.FileSource.Url);
    }

    FillFromFileObjects (fileList)
    {
        this.Fill (fileList, OV.FileSource.File);
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
        OV.RunTasks (this.files.length, {
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
        let fileName = OV.GetFileName (filePath).toLowerCase ();
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
            if (file.source !== OV.FileSource.Url && file.source !== OV.FileSource.Decompressed) {
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
            let file = new OV.File (fileObject, fileSource);
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
        if (file.source === OV.FileSource.Url) {
            loaderPromise = OV.RequestUrl (file.fileUrl, OV.FileFormat.Binary);
        } else if (file.source === OV.FileSource.File) {
            loaderPromise = OV.ReadFile (file.fileObject, OV.FileFormat.Binary);
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
};
