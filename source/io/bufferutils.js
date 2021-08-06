OV.ArrayBufferToUtf8String = function (buffer)
{
	let decoder = new TextDecoder ('utf-8');
	return decoder.decode (buffer);
};

OV.ArrayBufferToAsciiString = function (buffer)
{
	let text = '';
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < bufferView.byteLength; i++) {
		text += String.fromCharCode (bufferView[i]);
	}
	return text;
};

OV.AsciiStringToArrayBuffer = function (str)
{
	let buffer = new ArrayBuffer (str.length);
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < str.length; i++) {
		bufferView[i] = str.charCodeAt (i);
	}
	return buffer;
};

OV.Utf8StringToArrayBuffer = function (str)
{
	let encoder = new TextEncoder ();
	return encoder.encode (str);
};

OV.Base64DataURIToArrayBuffer = function (uri)
{
	let dataPrefix = 'data:';
	if (!uri.startsWith (dataPrefix)) {
		return null;
	}

	let mimeSeparator = uri.indexOf (';');
	if (mimeSeparator === -1) {
		return null;
	}

	let bufferSeparator = uri.indexOf (',');
	if (bufferSeparator === -1) {
		return null;
	}

	let mimeType = uri.substr (dataPrefix.length, mimeSeparator - 5);
	let base64String = atob (uri.substr (bufferSeparator + 1));
	let buffer = new ArrayBuffer (base64String.length);
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < base64String.length; i++) {
		bufferView[i] = base64String.charCodeAt (i);
	}

	return {
		mimeType : mimeType,
		buffer : buffer
	};
};

OV.GetFileExtensionFromMimeType = function (mimeType)
{
	if (mimeType === undefined || mimeType === null) {
		return '';
	}
	let mimeParts = mimeType.split ('/');
	if (mimeParts.length === 0) {
		return '';
	}
	return mimeParts[mimeParts.length - 1];
};

OV.CreateObjectUrl = function (content)
{
	let blob = new Blob ([content]);
	let url = URL.createObjectURL (blob);
	return url;
};

OV.CreateObjectUrlWithMimeType = function (content, mimeType)
{
	let blob = new Blob ([content], { type : mimeType });
	let url = URL.createObjectURL (blob);
	return url;
};

OV.RevokeObjectUrl = function (url)
{
	URL.revokeObjectURL (url);
};
