import { RunTaskAsync } from '../core/taskrunner.js';
import { FileSource, GetFileName } from '../io/fileutils.js';
import { RGBColor } from '../model/color.js';
import { ImporterFile, ImporterFileList } from './importerfiles.js';
import { Importer3dm } from './importer3dm.js';
import { Importer3ds } from './importer3ds.js';
import { ImporterGltf } from './importergltf.js';
import { ImporterIfc } from './importerifc.js';
import { ImporterObj } from './importerobj.js';
import { ImporterOff } from './importeroff.js';
import { ImporterPly } from './importerply.js';
import { ImporterOcct } from './importerocct.js';
import { ImporterStl } from './importerstl.js';
import { ImporterBim } from './importerbim.js';
import { ImporterThreeAmf, ImporterThree3mf, ImporterThreeDae, ImporterThreeFbx, ImporterThreeWrl } from './importerthree.js';
import { ImporterFcstd } from './importerfcstd.js';

import * as fflate from 'fflate';

export class ImportSettings
{
    constructor ()
    {
        this.defaultLineColor = new RGBColor (100, 100, 100);
        this.defaultColor = new RGBColor (200, 200, 200);
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
    constructor (code)
    {
        this.code = code;
        this.mainFile = null;
        this.message = null;
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
            new ImporterBim (),
            new Importer3dm (),
            new ImporterIfc (),
            new ImporterOcct (),
            new ImporterFcstd (),
            new ImporterThreeFbx (),
            new ImporterThreeDae (),
            new ImporterThreeWrl (),
            new ImporterThree3mf (),
            new ImporterThreeAmf ()
        ];
        this.fileList = new ImporterFileList ();
        this.model = null;
        this.usedFiles = [];
        this.missingFiles = [];
    }

	AddImporter (importer)
	{
		this.importers.push (importer);
	}

    ImportFiles (inputFiles, settings, callbacks)
    {
        callbacks.onLoadStart ();
        this.LoadFiles (inputFiles, {
            onReady : () => {
                callbacks.onImportStart ();
                RunTaskAsync (() => {
                    this.DecompressArchives (this.fileList, () => {
                        this.ImportLoadedFiles (settings, callbacks);
                    });
                });
            },
            onFileListProgress : callbacks.onFileListProgress,
            onFileLoadProgress : callbacks.onFileLoadProgress
        });
    }

    LoadFiles (inputFiles, callbacks)
    {
        let newFileList = new ImporterFileList ();
        newFileList.FillFromInputFiles (inputFiles);

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
                this.fileList.ExtendFromFileList (newFileList);
                reset = false;
            }
        }
        if (reset) {
            this.fileList = newFileList;
        }
        this.fileList.GetContent ({
            onReady : callbacks.onReady,
            onFileListProgress : callbacks.onFileListProgress,
            onFileLoadProgress : callbacks.onFileLoadProgress
        });
    }

    ImportLoadedFiles (settings, callbacks)
    {
        let importableFiles = this.GetImportableFiles (this.fileList);
        if (importableFiles.length === 0) {
            callbacks.onImportError (new ImportError (ImportErrorCode.NoImportableFile));
            return;
        }

        if (importableFiles.length === 1 || !callbacks.onSelectMainFile) {
            let mainFile = importableFiles[0];
            this.ImportLoadedMainFile (mainFile, settings, callbacks);
        } else {
            let fileNames = importableFiles.map (importableFile => importableFile.file.name);
            callbacks.onSelectMainFile (fileNames, (mainFileIndex) => {
                if (mainFileIndex === null) {
                    callbacks.onImportError (new ImportError (ImportErrorCode.NoImportableFile));
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
            let error = new ImportError (ImportErrorCode.FailedToLoadFile);
            if (mainFile !== null && mainFile.file !== null) {
                error.mainFile = mainFile.file.name;
            }
            callbacks.onImportError (error);
            return;
        }

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
            getDefaultLineMaterialColor : () => {
                return settings.defaultLineColor;
            },
            getDefaultMaterialColor : () => {
                return settings.defaultColor;
            },
            getFileBuffer : (filePath) => {
                return fileAccessor.GetFileBuffer (filePath);
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
                let error = new ImportError (ImportErrorCode.ImportFailed);
                error.mainFile = mainFile.file.name;
                error.message = importer.GetErrorMessage ();
                callbacks.onImportError (error);
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
        for (let i = 0; i < archives.length; i++) {
            const archiveFile = archives[i];
            const archiveBuffer = new Uint8Array (archiveFile.content);
            const decompressed = fflate.unzipSync (archiveBuffer);
            for (const fileName in decompressed) {
                if (Object.prototype.hasOwnProperty.call (decompressed, fileName)) {
                    let file = new ImporterFile (fileName, FileSource.Decompressed, null);
                    file.SetContent (decompressed[fileName].buffer);
                    fileList.AddFile (file);
                }
            }
        }
        onReady ();
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
}
