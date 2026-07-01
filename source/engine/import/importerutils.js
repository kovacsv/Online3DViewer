import { IsLower } from '../geometry/geometry.js';
import { PhongMaterial } from '../model/material.js';
import { RGBColor, IntegerToHexString } from '../model/color.js';
import { LoadExternalLibraryFromUrl } from '../io/externallibs.js';

export function NameFromLine (line, startIndex, commentChar)
{
	let name = line.substring (startIndex);
	let commentStart = name.indexOf (commentChar);
	if (commentStart !== -1) {
		name = name.substring (0, commentStart);
	}
	return name.trim ();
}

export function ParametersFromLine (line, commentChar)
{
	if (commentChar !== null) {
		let commentStart = line.indexOf (commentChar);
		if (commentStart !== -1) {
			line = line.substring (0, commentStart).trim ();
		}
	}
	return line.split (/\s+/u);
}

export function ReadLines (str, onLine)
{
	function LineFound (line, onLine)
	{
		let trimmed = line.trim ();
		if (trimmed.length > 0) {
			onLine (trimmed);
		}
	}

	let cursor = 0;
	let next = str.indexOf ('\n', cursor);
	while (next !== -1) {
		LineFound (str.substring (cursor, next), onLine);
		cursor = next + 1;
		next = str.indexOf ('\n', cursor);
	}
	LineFound (str.substring (cursor), onLine);
}

export function IsPowerOfTwo (x)
{
	return (x & (x - 1)) === 0;
}

export function NextPowerOfTwo (x)
{
	if (IsPowerOfTwo (x)) {
		return x;
	}
	let npot = Math.pow (2, Math.ceil (Math.log (x) / Math.log (2)));
	return parseInt (npot, 10);
}

export function UpdateMaterialTransparency (material)
{
	material.transparent = false;
	if (IsLower (material.opacity, 1.0)) {
		material.transparent = true;
	}
}

export class ColorToMaterialConverter
{
	constructor (model)
	{
		this.model = model;
		this.colorToMaterialIndex = new Map ();
	}

	GetMaterialIndex (r, g, b, a)
	{
		let colorKey =
			IntegerToHexString (r) +
			IntegerToHexString (g) +
			IntegerToHexString (b);
		let hasAlpha = (a !== undefined && a !== null);
		if (hasAlpha) {
			colorKey += IntegerToHexString (a);
		}

		if (this.colorToMaterialIndex.has (colorKey)) {
			return this.colorToMaterialIndex.get (colorKey);
		} else {
            let material = new PhongMaterial ();
            material.name = colorKey.toUpperCase ();
            material.color = new RGBColor (r, g, b);
            if (hasAlpha && a < 255) {
                material.opacity = a / 255.0;
                UpdateMaterialTransparency (material);
            }
            let materialIndex = this.model.AddMaterial (material);
            this.colorToMaterialIndex.set (colorKey, materialIndex);
            return materialIndex;
		}
	}
}

const DefaultOcctImportJsBaseUrl = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22/dist/';

let occtWorkerUrl = null;
let occtImportJsBaseUrl = DefaultOcctImportJsBaseUrl;

function ClearOcctWorkerUrl ()
{
	if (occtWorkerUrl !== null && URL.revokeObjectURL !== undefined) {
		URL.revokeObjectURL (occtWorkerUrl);
	}
	occtWorkerUrl = null;
}

function GetOcctImportJsFileUrl (fileName)
{
	let baseUrl = occtImportJsBaseUrl;
	if (!baseUrl.endsWith ('/')) {
		baseUrl += '/';
	}

	let documentBaseUrl = document.baseURI;
	let resolvedBaseUrl = new URL (baseUrl, documentBaseUrl).href;
	return new URL (fileName, resolvedBaseUrl).href;
}

export function SetOcctImportJsBaseUrl (baseUrl)
{
	if (baseUrl === null || baseUrl.length === 0) {
		occtImportJsBaseUrl = DefaultOcctImportJsBaseUrl;
	} else {
		occtImportJsBaseUrl = baseUrl;
	}
	ClearOcctWorkerUrl ();
}

export function GetOcctImportJsBaseUrl ()
{
	return occtImportJsBaseUrl;
}

export function CreateOcctWorker (worker)
{
	return new Promise ((resolve, reject) => {
		if (occtWorkerUrl !== null) {
			resolve (new Worker (occtWorkerUrl));
			return;
		}

		let workerScriptUrl = GetOcctImportJsFileUrl ('occt-import-js-worker.js');
		let importScriptUrl = GetOcctImportJsFileUrl ('occt-import-js.js');
		let wasmUrl = GetOcctImportJsFileUrl ('occt-import-js.wasm');
		fetch (workerScriptUrl)
			.then ((response) => {
				if (!response.ok) {
					return reject ();
				}
				return response.text ();
			})
			.then ((workerScript) => {
				workerScript = workerScript.replace ('occt-import-js.js', () => importScriptUrl);
				workerScript = workerScript.replace ('return path', () => 'return ' + JSON.stringify (wasmUrl));
				let blob = new Blob ([workerScript], { type : 'text/javascript' });
				occtWorkerUrl = URL.createObjectURL (blob);
				return resolve (new Worker (occtWorkerUrl));
			})
			.catch (reject);
	});
}

export function LoadExternalLibrary (libraryName)
{
	if (libraryName === 'rhino3dm') {
		return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js');
	} else if (libraryName === 'webifc') {
		return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/web-ifc-api-iife.js');
	} else if (libraryName === 'draco3d') {
		return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/draco3d@1.5.7/draco_decoder_nodejs.min.js');
	} else {
		return null;
	}
}
