module.exports =
{
	AddNativeSourceFile : function (fileName)
	{
		var path = require ('path');
		var rootDir = path.join (__dirname, '..');
		var fullPath = path.resolve (rootDir, fileName);

		var fs = require ('fs');
		var content = fs.readFileSync (fullPath).toString ();

		eval.apply (global, [content]);
	}
}
