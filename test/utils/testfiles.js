var testUtils = require ('./testutils.js');

module.exports =
{
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
		var content = null;
		if (format == OV.FileFormat.Text) {
			content = testUtils.GetTextFileContent (folder, fileName);
		} else if (format == OV.FileFormat.Binary) {
			content = testUtils.GetArrayBufferFileContent (folder, fileName);
		}
		var extension = OV.GetFileExtension (fileName);
		let buffers = new OV.ImporterBuffers (function (filePath) {
			let extension = OV.GetFileExtension (filePath);
			let knownFormats = importer.GetKnownFileFormats ();
			let format = OV.FileFormat.Binary;
			if (knownFormats[extension] !== undefined) {
				format = knownFormats[extension];
			}
			let fileContent = null;
			if (format == OV.FileFormat.Text) {
				fileContent = testUtils.GetTextFileContent (folder, filePath);
			} else if (format == OV.FileFormat.Binary) {
				fileContent = testUtils.GetArrayBufferFileContent (folder, filePath);
			}
			return fileContent;
		});
		importer.Import (content, extension, {
			getDefaultMaterial : function () {
				var material = new OV.Material ();
				return material;
			},
			getFileBuffer : function (filePath) {
				return buffers.GetFileBuffer (filePath);
			},
			getTextureBuffer : function (filePath) {
				return buffers.GetTextureBuffer (filePath);
			}
		});
		let model = importer.GetModel ();
		return model;
	}
}
