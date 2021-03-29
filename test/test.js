var fs = require ('fs');
process.chdir (__dirname);

global.atob = function (base64String) {
    return Buffer.from (base64String, 'base64').toString('binary');
};

global.Blob = function () {

};

global.URL = {
	createObjectURL : function () {
		return 'ObjectUrl';
	}
}

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
