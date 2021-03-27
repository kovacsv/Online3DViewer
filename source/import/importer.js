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
		}
		this.content = null;
	}
};

OV.FileList = class
{
	constructor (importers)
	{
		this.files = [];
		this.importers = importers;
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
		let obj = this;
		let taskRunner = new OV.TaskRunner ();
		taskRunner.Run (this.files.length, {
			runTask : function (index, complete) {
				obj.GetFileContent (obj.files[index], complete);
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

	HasMainFile ()
	{
		return this.GetMainFile () !== null;
	}

	GetMainFile ()
	{
		for (let fileIndex = 0; fileIndex < this.files.length; fileIndex++) {
			let file = this.files[fileIndex];
			let importer = this.FindImporter (file);
			if (importer !== null) {
				return {
					file : file,
					importer : importer
				};
			}
		}
		return null;
	}

	IsOnlySource (source)
	{
		if (this.files.length === 0) {
			return false;
		}
		for (let i = 0; i < this.files.length; i++) {
			let file = this.files[i];
			if (file.source !== source) {
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
		let callbacks = {
			success : function (content) {
				file.content = content;
			},
			error : function () {
				
			},
			complete : function () {
				complete ();
			}
		};
		if (file.content !== null) {
			complete ();
			return;
		}
		let format = this.GetFileFormat (file);
		if (file.source === OV.FileSource.Url) {
			OV.RequestUrl (file.fileUrl, format, callbacks);
		} else if (file.source === OV.FileSource.File) {
			OV.ReadFile (file.fileObject, format, callbacks);
		}
	}
	
	GetFileFormat (file)
	{
		for (let importerIndex = 0; importerIndex < this.importers.length; importerIndex++) {
			let importer = this.importers[importerIndex];
			let extension = file.extension.toLowerCase ();
			let knownFormats = importer.GetKnownFileFormats ();
			if (knownFormats[extension] !== undefined) {
				return knownFormats[extension];
			}
		}
		return OV.FileFormat.Binary;
	}

	FindImporter (file)
	{
		for (let importerIndex = 0; importerIndex < this.importers.length; importerIndex++) {
			let importer = this.importers[importerIndex];
			if (importer.CanImportExtension (file.extension.toLowerCase ())) {
				return importer;
			}
		}
		return null;
	}
};

OV.ImporterErrorCode =
{
	NoImportableFile : 1,
	ImportFailed : 2,
	UnknownError : 3
};

OV.ImporterError = class
{
	constructor (code, message)
	{
		this.code = code;
		this.message = message;
	}
};

OV.ImportResult = class
{
	constructor ()
	{
		this.model = null;
		this.mainFile = null;
		this.upVector = null;
		this.usedFiles = [];
		this.missingFiles = [];
	}
};

OV.Importer = class
{
	constructor ()
	{
		this.importers = [
			new OV.ImporterObj (),
			new OV.ImporterStl (),
			new OV.ImporterOff (),
			new OV.ImporterPly (),
			new OV.Importer3ds (),
			new OV.ImporterGltf ()
		];
		this.fileList = new OV.FileList (this.importers);
		this.missingFiles = [];
	}
	
	LoadFilesFromUrls (fileList, onReady)
	{
		this.LoadFiles (fileList, OV.FileSource.Url, onReady);
	}

	LoadFilesFromFileObjects (fileList, onReady)
	{
		this.LoadFiles (fileList, OV.FileSource.File, onReady);
	}

	Import (callbacks)
	{
		let mainFile = this.fileList.GetMainFile ();
		if (mainFile === null || mainFile.file.content === null) {
			callbacks.error (new OV.ImporterError (OV.ImporterErrorCode.NoImportableFile, null));
			return;
		}

		let result = new OV.ImportResult ();
		result.mainFile = mainFile.file.name;
		result.usedFiles.push (mainFile.file.name);

		let fileNameToContent = {};
		let textureNameToUrl = {};

		let obj = this;
		let importer = mainFile.importer;
		importer.Import (mainFile.file.content, mainFile.file.extension, {
			getDefaultMaterial : function () {
				let material = new OV.Material ();
				material.diffuse = new OV.Color (200, 200, 200);
				return material;
			},
			getFileContent : function (filePath) {
				let fileName = OV.GetFileName (filePath);
				let fileContent = fileNameToContent[fileName];
				if (fileContent === undefined) {
					let file = obj.fileList.FindFileByPath (filePath);
					if (file === null || file.content === null) {
						result.missingFiles.push (fileName);
						obj.missingFiles.push (fileName);
						fileContent = null;
					} else {
						result.usedFiles.push (fileName);
						fileContent = file.content;
					}
					fileNameToContent[fileName] = fileContent;
				}
				return fileContent;
			},
			getTextureObjectUrl : function (filePath) {
				let fileName = OV.GetFileName (filePath);
				let textureUrl = textureNameToUrl[fileName];
				if (textureUrl === undefined) {
					let file = obj.fileList.FindFileByPath (filePath);
					if (file === null || file.content === null) {
						result.missingFiles.push (fileName);
						obj.missingFiles.push (fileName);
						textureUrl = null;
					} else {
						result.usedFiles.push (fileName);
						let blob = new Blob ([file.content]);
						let blobURL = URL.createObjectURL (blob);
						textureUrl = blobURL;
					}
					textureNameToUrl[fileName] = textureUrl;
				}
				return textureUrl;
			}
		});

		if (importer.IsError ()) {
			let message = importer.GetMessage ();
			callbacks.error (new OV.ImporterError (OV.ImporterErrorCode.ImportFailed, message));
			return;
		}

		result.model = importer.GetModel ();
		result.model.SetName (mainFile.file.name);
		result.upVector = importer.GetUpDirection ();
		callbacks.success (result);
	}

	LoadFiles (fileList, fileSource, onReady)
	{
		let newFileList = new OV.FileList (this.importers);
		if (fileSource === OV.FileSource.Url) {
			newFileList.FillFromFileUrls (fileList);
		} else if (fileSource === OV.FileSource.File) {
			newFileList.FillFromFileObjects (fileList);
		}
		let reset = false;
		if (newFileList.HasMainFile ()) {
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
		this.missingFiles = [];
		this.fileList.GetContent (function () {
			onReady ();
		});
	}

	GetFileList ()
	{
		return this.fileList;
	}

	IsOnlyFileSource (source)
	{
		return this.fileList.IsOnlySource (source);
	}	
};
