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
