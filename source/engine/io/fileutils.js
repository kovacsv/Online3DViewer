/**
 * File source identifier for import.
 * @enum
 */
export const FileSource =
{
	/** The file is provided by a URL. */
    Url : 1,
	/** The file is provided by a {@link File} object. */
    File : 2,
	/** Used internally if a file is originated by a compressed archive. */
	Decompressed : 3
};

export const FileFormat =
{
    Text : 1,
    Binary : 2
};

export function GetFileName (filePath)
{
	let fileName = filePath;

	let firstParamIndex = fileName.indexOf ('?');
	if (firstParamIndex !== -1) {
		fileName = fileName.substring (0, firstParamIndex);
	}

	let firstSeparator = fileName.lastIndexOf ('/');
	if (firstSeparator === -1) {
		firstSeparator = fileName.lastIndexOf ('\\');
	}
	if (firstSeparator !== -1) {
		fileName = fileName.substring (firstSeparator + 1);
	}

	return decodeURI (fileName);
}

export function GetFileExtension (filePath)
{
	let fileName = GetFileName (filePath);
	let firstPoint = fileName.lastIndexOf ('.');
	if (firstPoint === -1) {
		return '';
	}
	let extension = fileName.substring (firstPoint + 1);
	return extension.toLowerCase ();
}

export function RequestUrl (url, onProgress)
{
	return new Promise ((resolve, reject) => {
		let request = new XMLHttpRequest ();
		request.open ('GET', url, true);

		request.onprogress = (event) => {
			onProgress (event.loaded, event.total);
		};

		request.onload = () => {
			if (request.status === 200) {
				resolve (request.response);
			} else {
				reject ();
			}
		};

		request.onerror = () => {
			reject ();
		};

		request.responseType = 'arraybuffer';
		request.send (null);
	});
}

export function ReadFile (file, onProgress)
{
	return new Promise ((resolve, reject) => {
		let reader = new FileReader ();

		reader.onprogress = (event) => {
			onProgress (event.loaded, event.total);
		};

		reader.onloadend = (event) => {
			if (event.target.readyState === FileReader.DONE) {
				resolve (event.target.result);
			}
		};

		reader.onerror = () => {
			reject ();
		};

		reader.readAsArrayBuffer (file);
	});
}

export function TransformFileHostUrls (urls)
{
    for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        if (url.indexOf ('www.dropbox.com') !== -1) {
            url = url.replace ('www.dropbox.com', 'dl.dropbox.com');
            urls[i] = url;
        } else if (url.indexOf ('github.com') !== -1) {
            url = url.replace ('github.com', 'raw.githubusercontent.com');
            url = url.replace ('/blob', '');
            urls[i] = url;
        }
    }
}

export function IsUrl (str)
{
	const regex = /^https?:\/\/\S+$/g;
	const match = str.match (regex);
	return match !== null;
}
