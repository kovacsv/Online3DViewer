import { IsLower } from '../geometry/geometry.js';

export function NameFromLine (line, startIndex, commentChar)
{
	let name = line.substr (startIndex);
	let commentStart = name.indexOf (commentChar);
	if (commentStart !== -1) {
		name = name.substr (0, commentStart);
	}
	return name.trim ();
}

export function ParametersFromLine (line, commentChar)
{
	if (commentChar !== null) {
		let commentStart = line.indexOf (commentChar);
		if (commentStart !== -1) {
			line = line.substr (0, commentStart).trim ();
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
		LineFound (str.substr (cursor, next - cursor), onLine);
		cursor = next + 1;
		next = str.indexOf ('\n', cursor);
	}
	LineFound (str.substr (cursor), onLine);
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
