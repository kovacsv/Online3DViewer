OV.FileSource =
{
    Url : 1,
    File : 2
};

OV.FileFormat =
{
    Text : 1,
    Binary : 2
};

OV.GetFileName = function (filePath)
{
	let firstSeparator = filePath.lastIndexOf ('/');
	if (firstSeparator === -1) {
		firstSeparator = filePath.lastIndexOf ('\\');
	}
	let fileName = filePath;
	if (firstSeparator !== -1) {
		fileName = filePath.substr (firstSeparator + 1);
	}
	let firstParamIndex = fileName.indexOf ('?');
	if (firstParamIndex !== -1) {
		fileName = fileName.substr (0, firstParamIndex);
	}
	return decodeURI (fileName);
};

OV.GetFileExtension = function (filePath)
{
	let fileName = OV.GetFileName (filePath);
	let firstPoint = fileName.lastIndexOf ('.');
	if (firstPoint === -1) {
		return '';
	}
	let extension = fileName.substr (firstPoint + 1);
	return extension.toLowerCase ();
};

OV.RequestUrl = function (url, format)
{
	return new Promise ((resolve, reject) => {
		let request = new XMLHttpRequest ();
		request.open ('GET', url, true);
		if (format === OV.FileFormat.Text) {
			request.responseType = 'text';
		} else if (format === OV.FileFormat.Binary) {
			request.responseType = 'arraybuffer';
		} else {
			reject ();
			return;
		}
	
		request.onload = function () {
			if (request.status === 200) {
				resolve (request.response);
			} else {
				reject ();
			}
		};
		
		request.onerror = function () {
			reject ();
		};
	
		request.send (null);
	});
};

OV.ReadFile = function (file, format)
{
	return new Promise ((resolve, reject) => {
		let reader = new FileReader ();

		reader.onloadend = function (event) {
			if (event.target.readyState === FileReader.DONE) {
				resolve (event.target.result);
			}
		};
		
		reader.onerror = function () {
			reject ();
		};

		if (format === OV.FileFormat.Text) {
			reader.readAsText (file);
		} else if (format === OV.FileFormat.Binary) {
			reader.readAsArrayBuffer (file);
		} else {
			reject ();
		}
	});
};

