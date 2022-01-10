import { RunTaskAsync } from '../core/taskrunner.js';
import { CreateObjectUrl, RevokeObjectUrl } from '../io/bufferutils.js';
import { LoadExternalLibrary } from '../io/externallibs.js';
import { FileSource, GetFileName } from '../io/fileutils.js';
import { Color } from '../model/color.js';
import { File, FileList } from './filelist.js';
import { Importer3dm } from './importer3dm.js';
import { Importer3ds } from './importer3ds.js';
import { ImporterGltf } from './importergltf.js';
import { ImporterIfc } from './importerifc.js';
import { ImporterO3dv } from './importero3dv.js';
import { ImporterObj } from './importerobj.js';
import { ImporterOff } from './importeroff.js';
import { ImporterPly } from './importerply.js';
import { ImporterStl } from './importerstl.js';
import { ImporterThree3mf, ImporterThreeDae, ImporterThreeFbx, ImporterThreeWrl } from './importerthree.js';

export class ImportSettings
{
    constructor ()
    {
        this.defaultColor = new Color (200, 200, 200);
    }
}

export const ImportErrorCode =
{
    NoImportableFile : 1,
    FailedToLoadFile : 2,
    ImportFailed : 3,
    UnknownError : 4
};

export class ImportError
{
    constructor (code, message)
    {
        this.code = code;
        this.message = message;
    }
}

export class ImportResult
{
    constructor ()
    {
        this.model = null;
        this.mainFile = null;
        this.upVector = null;
        this.usedFiles = null;
        this.missingFiles = null;
    }
}

export class ImporterFileAccessor
{
    constructor (getBufferCallback)
    {
        this.getBufferCallback = getBufferCallback;
        this.fileBuffers = new Map ();
        this.textureBuffers = new Map ();
    }

    GetFileBuffer (filePath)
    {
        let fileName = GetFileName (filePath);
        if (this.fileBuffers.has (fileName)) {
            return this.fileBuffers.get (fileName);
        }
        let buffer = this.getBufferCallback (fileName);
        this.fileBuffers.set (fileName, buffer);
        return buffer;
    }

    GetTextureBuffer (filePath)
    {
        let fileName = GetFileName (filePath);
        if (this.textureBuffers.has (fileName)) {
            return this.textureBuffers.get (fileName);
        }
        let buffer = null;
        let textureBuffer = this.getBufferCallback (fileName);
        if (textureBuffer !== null) {
            buffer = {
                url : CreateObjectUrl (textureBuffer),
                buffer : textureBuffer
            };
        }
        this.textureBuffers.set (fileName, buffer);
        return buffer;
    }
}

export class Importer
{
    constructor ()
    {
        this.importers = [
            new ImporterObj (),
            new ImporterStl (),
            new ImporterOff (),
            new ImporterPly (),
            new Importer3ds (),
            new ImporterGltf (),
            new ImporterO3dv (),
            new Importer3dm (),
            new ImporterIfc (),
            new ImporterThreeFbx (),
            new ImporterThreeDae (),
            new ImporterThreeWrl (),
            new ImporterThree3mf ()
        ];
        this.fileList = new FileList ();
        this.model = null;
        this.usedFiles = [];
        this.missingFiles = [];
    }

	AddImporter (importer)
	{
		this.importers.push (importer);
	}

    ImportFiles (fileList, fileSource, settings, callbacks)
    {
        this.LoadFiles (fileList, fileSource, () => {
            callbacks.onFilesLoaded ();
            RunTaskAsync (() => {
                this.ImportLoadedFiles (settings, callbacks);
            });
        });
    }

    LoadFiles (fileList, fileSource, onReady)
    {
        let newFileList = new FileList (this.importers);
        if (fileSource === FileSource.Url) {
            newFileList.FillFromFileUrls (fileList);
        } else if (fileSource === FileSource.File) {
            newFileList.FillFromFileObjects (fileList);
        }
        let reset = false;
        if (this.HasImportableFile (newFileList)) {
            reset = true;
        } else {
            let foundMissingFile = false;
            for (let i = 0; i < this.missingFiles.length; i++) {
                let missingFile = this.missingFiles[i];
                if (newFileList.ContainsFileByPath (missingFile)) {
                    foundMissingFile = true;
                }
            }
            if (!foundMissingFile) {
                reset = true;
            } else {
                let newFiles = newFileList.GetFiles ();
                this.fileList.ExtendFromFileList (newFiles);
                reset = false;
            }
        }
        if (reset) {
            this.fileList = newFileList;
        }
        this.fileList.GetContent (() => {
            this.DecompressArchives (this.fileList, () => {
                onReady ();
            });
        });
    }

    ImportLoadedFiles (settings, callbacks)
    {
        let importableFiles = this.GetImportableFiles (this.fileList);
        if (importableFiles.length === 0) {
            callbacks.onImportError (new ImportError (ImportErrorCode.NoImportableFile, null));
            return;
        }

        if (importableFiles.length === 1 || !callbacks.onSelectMainFile) {
            let mainFile = importableFiles[0];
            this.ImportLoadedMainFile (mainFile, settings, callbacks);
        } else {
            let fileNames = importableFiles.map (importableFile => importableFile.file.name);
            callbacks.onSelectMainFile (fileNames, (mainFileIndex) => {
                if (mainFileIndex === null) {
                    callbacks.onImportError (new ImportError (ImportErrorCode.NoImportableFile, null));
                    return;
                }
                RunTaskAsync (() => {
                    let mainFile = importableFiles[mainFileIndex];
                    this.ImportLoadedMainFile (mainFile, settings, callbacks);
                });
            });
        }
    }

    ImportLoadedMainFile (mainFile, settings, callbacks)
    {
        if (mainFile === null || mainFile.file === null || mainFile.file.content === null) {
            callbacks.onImportError (new ImportError (ImportErrorCode.FailedToLoadFile, null));
            return;
        }

        this.RevokeModelUrls ();
        this.model = null;
        this.usedFiles = [];
        this.missingFiles = [];
        this.usedFiles.push (mainFile.file.name);

        let importer = mainFile.importer;
        let fileAccessor = new ImporterFileAccessor ((fileName) => {
            let fileBuffer = null;
            let file = this.fileList.FindFileByPath (fileName);
            if (file === null || file.content === null) {
                this.missingFiles.push (fileName);
                fileBuffer = null;
            } else {
                this.usedFiles.push (fileName);
                fileBuffer = file.content;
            }
            return fileBuffer;
        });

        importer.Import (mainFile.file.name, mainFile.file.extension, mainFile.file.content, {
            getDefaultMaterialColor : () => {
                return settings.defaultColor;
            },
            getFileBuffer : (filePath) => {
                return fileAccessor.GetFileBuffer (filePath);
            },
            getTextureBuffer : (filePath) => {
                return fileAccessor.GetTextureBuffer (filePath);
            },
            onSuccess : () => {
                this.model = importer.GetModel ();
                let result = new ImportResult ();
                result.mainFile = mainFile.file.name;
                result.model = this.model;
                result.usedFiles = this.usedFiles;
                result.missingFiles = this.missingFiles;
                result.upVector = importer.GetUpDirection ();
                callbacks.onImportSuccess (result);
            },
            onError : () => {
                let message = importer.GetErrorMessage ();
                callbacks.onImportError (new ImportError (ImportErrorCode.ImportFailed, message));
            },
            onComplete : () => {
                importer.Clear ();
            }
        });
    }

    DecompressArchives (fileList, onReady)
    {
        let files = fileList.GetFiles ();
        let archives = [];
        for (let file of files) {
            if (file.extension === 'zip') {
                archives.push (file);
            }
        }
        if (archives.length === 0) {
            onReady ();
            return;
        }
        LoadExternalLibrary ('loaders/fflate.min.js').then (() => {
            for (let i = 0; i < archives.length; i++) {
                const archiveFile = archives[i];
                const archiveBuffer = new Uint8Array (archiveFile.content);
                const decompressed = fflate.unzipSync (archiveBuffer);
                for (const fileName in decompressed) {
                    if (Object.prototype.hasOwnProperty.call (decompressed, fileName)) {
                        let file = new File (fileName, FileSource.Decompressed);
                        file.SetContent (decompressed[fileName].buffer);
                        fileList.AddFile (file);
                    }
                }
            }
            onReady ();
        }).catch (() => {
            onReady ();
        });
    }

    GetFileList ()
    {
        return this.fileList;
    }

    HasImportableFile (fileList)
    {
        let importableFiles = this.GetImportableFiles (fileList);
        return importableFiles.length > 0;
    }

    GetImportableFiles (fileList)
    {
        function FindImporter (file, importers)
        {
            for (let importerIndex = 0; importerIndex < importers.length; importerIndex++) {
                let importer = importers[importerIndex];
                if (importer.CanImportExtension (file.extension)) {
                    return importer;
                }
            }
            return null;
        }

        let importableFiles = [];
        let files = fileList.GetFiles ();
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            let file = files[fileIndex];
            let importer = FindImporter (file, this.importers);
            if (importer !== null) {
                importableFiles.push ({
                    file : file,
                    importer : importer
                });
            }
        }
        return importableFiles;
    }

    RevokeModelUrls ()
    {
        if (this.model === null) {
            return;
        }
        for (let i = 0; i < this.model.MaterialCount (); i++) {
            let material = this.model.GetMaterial (i);
            material.EnumerateTextureMaps ((texture) => {
                if (texture.url !== null) {
                    RevokeObjectUrl (texture.url);
                }
            });
        }
    }
}
