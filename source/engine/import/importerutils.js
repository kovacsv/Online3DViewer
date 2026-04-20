import { IsLower } from '../geometry/geometry.js';
import { PhongMaterial } from '../model/material.js';
import { RGBColor, IntegerToHexString } from '../model/color.js';

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

let occtWorkerUrl = null;

// Capture the URL of the script that loaded this bundle so we can locate
// companion assets (occt-import-js wasm/js/worker) relative to it. This works
// when the bundle is loaded via a classic <script src="..."> tag (e.g. the
// full website deployment). It does NOT work when the engine is imported as
// an ES module (`import * as OV from 'online-3d-viewer'`) — bundlers inline
// the module into the consumer's bundle, and `document.currentScript` is
// null during ES module evaluation. In that case the consumer must call
// `SetExternalLibLocation('occt-import-js', url)` before loading a model
// that needs occt (STEP/IGES/BRep/FCStd).
let occtScriptUrl = null;
if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
	occtScriptUrl = document.currentScript.src;
}

let externalLibLocations = {};

/**
 * Override the URL where companion asset files for an external library can be
 * fetched at runtime. Required when importing the engine as an ES module,
 * because the engine cannot auto-locate asset files from inside a bundle.
 *
 * Currently supports `occt-import-js` (STEP/IGES/BRep/FCStd formats). The URL
 * should be a directory URL (trailing slash recommended) containing the three
 * files from `node_modules/occt-import-js/dist/`:
 * `occt-import-js-worker.js`, `occt-import-js.js`, `occt-import-js.wasm`.
 *
 * @param {string} libraryName Library identifier (e.g. `'occt-import-js'`).
 * @param {string} url Absolute or root-relative URL of the directory that
 * contains the library's companion files.
 */
export function SetExternalLibLocation (libraryName, url)
{
	externalLibLocations[libraryName] = url;
}

export function CreateOcctWorker (worker)
{
	return new Promise ((resolve, reject) => {
		if (occtWorkerUrl !== null) {
			resolve (new Worker (occtWorkerUrl));
			return;
		}

		let baseUrl;
		if (externalLibLocations['occt-import-js']) {
			// Explicit override from consumer (required for ES-module imports).
			baseUrl = new URL (externalLibLocations['occt-import-js'], document.baseURI).href;
			if (!baseUrl.endsWith ('/')) {
				baseUrl += '/';
			}
		} else {
			// Auto-locate relative to the <script src> that loaded this bundle,
			// falling back to the page base URI when that's unavailable (ES modules).
			let baseRef = occtScriptUrl || document.baseURI;
			baseUrl = new URL ('assets/libs/occt-import-js/', baseRef).href;
		}
		fetch (baseUrl + 'occt-import-js-worker.js')
			.then ((response) => {
				if (!response.ok) {
					return reject ();
				}
				return response.text ();
			})
			.then ((workerScript) => {
				workerScript = workerScript.replace ('occt-import-js.js', baseUrl + 'occt-import-js.js');
				workerScript = workerScript.replace ('return path', 'return \'' + baseUrl + 'occt-import-js.wasm\'');
				let blob = new Blob ([workerScript], { type : 'text/javascript' });
				occtWorkerUrl = URL.createObjectURL (blob);
				return resolve (new Worker (occtWorkerUrl));
			})
			.catch (reject);
	});
}

export function LoadExternalLibrary (libraryName)
{
	// if (libraryName === 'rhino3dm') {
	// 	return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/rhino3dm.min.js');
	// } else if (libraryName === 'webifc') {
	// 	return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/web-ifc-api-iife.js');
	// } else if (libraryName === 'draco3d') {
	// 	return LoadExternalLibraryFromUrl ('https://cdn.jsdelivr.net/npm/draco3d@1.5.7/draco_decoder_nodejs.min.js');
	// } else {
	// 	return null;
	// }
	// DO NOT IMPORT ANY EXTERNAL library; we don't need the support for these three file formats anyway
	return null;
}
