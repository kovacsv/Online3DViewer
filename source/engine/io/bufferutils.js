export function ArrayBufferToUtf8String (buffer)
{
	let decoder = new TextDecoder ('utf-8');
	return decoder.decode (buffer);
}

export function ArrayBufferToAsciiString (buffer)
{
	let text = '';
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < bufferView.byteLength; i++) {
		text += String.fromCharCode (bufferView[i]);
	}
	return text;
}

export function AsciiStringToArrayBuffer (str)
{
	let buffer = new ArrayBuffer (str.length);
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < str.length; i++) {
		bufferView[i] = str.charCodeAt (i);
	}
	return buffer;
}

export function Utf8StringToArrayBuffer (str)
{
	let encoder = new TextEncoder ();
	let uint8Array = encoder.encode (str);
	return uint8Array.buffer;
}

export function Base64DataURIToArrayBuffer (uri)
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

	let mimeType = uri.substring (dataPrefix.length, dataPrefix.length + mimeSeparator - 5);
	let base64String = atob (uri.substring (bufferSeparator + 1));
	let buffer = new ArrayBuffer (base64String.length);
	let bufferView = new Uint8Array (buffer);
	for (let i = 0; i < base64String.length; i++) {
		bufferView[i] = base64String.charCodeAt (i);
	}

	return {
		mimeType : mimeType,
		buffer : buffer
	};
}

export function GetFileExtensionFromMimeType (mimeType)
{
	if (mimeType === undefined || mimeType === null) {
		return '';
	}
	let mimeParts = mimeType.split ('/');
	if (mimeParts.length === 0) {
		return '';
	}
	return mimeParts[mimeParts.length - 1];
}

export function CreateObjectUrl (content)
{
	let blob = new Blob ([content]);
	let url = URL.createObjectURL (blob);
	return url;
}

export function CreateObjectUrlWithMimeType (content, mimeType)
{
	let blob = new Blob ([content], { type : mimeType });
	let url = URL.createObjectURL (blob);
	return url;
}

export function RevokeObjectUrl (url)
{
	URL.revokeObjectURL (url);
}
