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
    // Match on the parsed hostname rather than a substring of the whole URL. A substring test
    // also matches an attacker-controlled host that merely embeds the name elsewhere — e.g.
    // https://evil.example/?x=www.dropbox.com or https://github.com.evil.example/ — and would
    // rewrite it into a URL the caller then fetches.
    for (let i = 0; i < urls.length; i++) {
        let url = null;
        try {
            url = new URL (urls[i]);
        } catch {
            continue;
        }
        if (url.hostname === 'www.dropbox.com') {
            url.hostname = 'dl.dropbox.com';
            urls[i] = url.href;
        } else if (url.hostname === 'github.com') {
            // https://github.com/<user>/<repo>/blob/<ref>/<path> is served raw at
            // https://raw.githubusercontent.com/<user>/<repo>/<ref>/<path>.
            url.hostname = 'raw.githubusercontent.com';
            url.pathname = url.pathname.replace ('/blob', '');
            urls[i] = url.href;
        }
    }
}

export function IsUrl (str)
{
	const regex = /^https?:\/\/\S+$/g;
	const match = str.match (regex);
	return match !== null;
}
