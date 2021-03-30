var path = require ('path');
var rewire = require ('rewire');

var config = require ('../../tools/config.json')
var importerFiles = config['importer_files'];
var fileIndex, filePath;
for (fileIndex = 0; fileIndex < importerFiles.length; fileIndex++) {
    filePath = importerFiles[fileIndex];
    rewire (path.join ('..', '..', filePath));
}
