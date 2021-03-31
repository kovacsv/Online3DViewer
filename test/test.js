var fs = require ('fs');
process.chdir (__dirname);

require ('./utils/globals.js');
require ('./utils/importall.js');
var testDirName = './tests/';
var files = fs.readdirSync (testDirName, { withFileTypes: true });
var i, file;
for (i = 0; i < files.length; i++) {
    file = files[i];
    if (file.isFile ()) {
        require (testDirName + file.name);
    }
}
