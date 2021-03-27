var path = require ('path');
var nativeImport = require ('../framework/native_import.js');

var config = require ('../../tools/config.json')
var importerFiles = config['importer_files'];
var fileIndex, filePath;
for (fileIndex = 0; fileIndex < importerFiles.length; fileIndex++) {
    filePath = importerFiles[fileIndex];
    nativeImport.AddNativeSourceFile (path.join ('..', filePath));
}
