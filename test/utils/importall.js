var path = require ('path');
var rewire = require ('rewire');

var config = require ('../../tools/config.json')
var engineFiles = config['engine_files'];
var fileIndex, filePath;
for (fileIndex = 0; fileIndex < engineFiles.length; fileIndex++) {
    filePath = engineFiles[fileIndex];
    rewire (path.join ('..', '..', filePath));
}
