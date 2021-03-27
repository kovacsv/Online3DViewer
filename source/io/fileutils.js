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
	return decodeURI (fileName);
};

OV.GetFileExtension = function (fileName)
{
	let firstPoint = fileName.lastIndexOf ('.');
	if (firstPoint === -1) {
		return '';
	}
	return fileName.substr (firstPoint + 1);
};

OV.RequestUrl = function (url, format, callbacks)
{
	function OnSuccess (result)
	{
		if (callbacks.success) {
			callbacks.success (result);
		}
		if (callbacks.complete) {
			callbacks.complete ();
		}		
	}

	function OnError ()
	{
		if (callbacks.error) {
			callbacks.error ();
		}
		if (callbacks.complete) {
			callbacks.complete ();
		}
	}

	let request = new XMLHttpRequest ();
	request.open ('GET', url, true);
	if (format === OV.FileFormat.Text) {
		request.responseType = 'text';
	} else if (format === OV.FileFormat.Binary) {
		request.responseType = 'arraybuffer';
	} else {
		OnError ();
		return;
	}

	request.onload = function () {
		if (request.status === 200) {
			let response = request.response;
			OnSuccess (response);
		} else {
			OnError ();
		}
	};
	
	request.onerror = function () {
		OnError ();
	};

	request.send (null);
};

OV.ReadFile = function (file, format, callbacks)
{
	function OnSuccess (result)
	{
		if (callbacks.success) {
			callbacks.success (result);
		}
		if (callbacks.complete) {
			callbacks.complete ();
		}		
	}

	function OnError ()
	{
		if (callbacks.error) {
			callbacks.error ();
		}
		if (callbacks.complete) {
			callbacks.complete ();
		}
	}

	let reader = new FileReader ();

	reader.onloadend = function (event) {
		if (event.target.readyState === FileReader.DONE) {
			OnSuccess (event.target.result);
		}
	};
	
	reader.onerror = function () {
		OnError ();
	};

	if (format === OV.FileFormat.Text) {
		reader.readAsText (file);
	} else if (format === OV.FileFormat.Binary) {
		reader.readAsArrayBuffer (file);
	} else {
		OnError ();
	}
};
