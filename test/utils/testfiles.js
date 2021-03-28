var path = require ('path');
var fs = require ('fs');
var testUtils = require ('./testutils.js')

module.exports =
{
	GetTextFileContent : function (folder, fileName)
	{
		var testFilePath = path.join ('testfiles', folder, fileName);
		return fs.readFileSync (testFilePath).toString ();
	},

	GetArrayBufferFileContent : function (folder, fileName)
	{
		var testFilePath = path.join ('testfiles', folder, fileName);
		var buffer = fs.readFileSync (testFilePath);
		var arrayBuffer = new ArrayBuffer (buffer.length);
		var uint8Array = new Uint8Array (arrayBuffer);
		var i;
		for (i = 0; i < buffer.length; ++i) {
			uint8Array[i] = buffer[i];
		}
		return arrayBuffer		
	},

	ImportObjFile : function (fileName)
	{	
		var importer = new OV.ImporterObj ();
		return this.ImportFile (importer, OV.FileFormat.Text, 'obj', fileName);
	},

	ImportStlFile : function (fileName)
	{	
		var importer = new OV.ImporterStl ();
		return this.ImportFile (importer, OV.FileFormat.Binary, 'stl', fileName);
	},

	ImportOffFile : function (fileName)
	{	
		var importer = new OV.ImporterOff ();
		return this.ImportFile (importer, OV.FileFormat.Text, 'off', fileName);
	},

	ImportPlyFile : function (fileName)
	{	
		var importer = new OV.ImporterPly ();
		return this.ImportFile (importer, OV.FileFormat.Binary, 'ply', fileName);
	},

	Import3dsFile : function (fileName)
	{	
		var importer = new OV.Importer3ds ();
		return this.ImportFile (importer, OV.FileFormat.Binary, '3ds', fileName);
	},

	ImportGltfFile : function (folderName, fileName)
	{	
		let extension = OV.GetFileExtension (fileName);
		let format = OV.FileFormat.Text;
		if (extension == 'glb') {
			format = OV.FileFormat.Binary;
		}
		var importer = new OV.ImporterGltf ();
		return this.ImportFile (importer, format, 'gltf/' + folderName, fileName);
	},

	ImportFile : function (importer, format, folder, fileName)
	{	
		var myThis = this;
		var content = null;
		if (format == OV.FileFormat.Text) {
			content = this.GetTextFileContent (folder, fileName);
		} else if (format == OV.FileFormat.Binary) {
			content = this.GetArrayBufferFileContent (folder, fileName);
		}
		var extension = OV.GetFileExtension (fileName);
		importer.Import (content, extension, {
			getDefaultMaterial : function () {
				var material = new OV.Material ();
				return material;
			},
			getFileBuffer : function (requestedFileName) {
				let extension = OV.GetFileExtension (requestedFileName);
				let knownFormats = importer.GetKnownFileFormats ();
				let format = OV.FileFormat.Binary;
				if (knownFormats[extension] !== undefined) {
					format = knownFormats[extension];
				}
				let fileContent = null;
				if (format == OV.FileFormat.Text) {
					fileContent = myThis.GetTextFileContent (folder, requestedFileName);
				} else if (format == OV.FileFormat.Binary) {
					fileContent = myThis.GetArrayBufferFileContent (folder, requestedFileName);
				}
				return {
					url : null,
					buffer : fileContent
				};
			}
		});
		let model = importer.GetModel ();
		return model;
	}
}
