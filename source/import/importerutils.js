OV.NameFromLine = function (line, startIndex, commentChar)
{
	let name = line.substr (startIndex);
	let commentStart = name.indexOf (commentChar);
	if (commentStart !== -1) {
		name = name.substr (0, commentStart);
	}
	return name.trim ();
};

OV.ParametersFromLine = function (line, commentChar)
{
	if (commentChar !== null) {
		let commentStart = line.indexOf (commentChar);
		if (commentStart !== -1) {
			line = line.substr (0, commentStart).trim ();
		}
	}
	return line.split (/\s+/u);
};

OV.ReadLines = function (str, onLine)
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
};

OV.IsPowerOfTwo = function (x)
{
	return (x & (x - 1)) === 0;
};

OV.NextPowerOfTwo = function (x)
{
	if (OV.IsPowerOfTwo (x)) {
		return x;
	}
	let npot = Math.pow (2, Math.ceil (Math.log (x) / Math.log (2)));
	return parseInt (npot, 10);
};

OV.ResizeImageToPowerOfTwoSides = function (image)
{
	if (OV.IsPowerOfTwo (image.width) && OV.IsPowerOfTwo (image.height)) {
		return image;
	}
	
	let width = OV.NextPowerOfTwo (image.width);
	let height = OV.NextPowerOfTwo (image.height);

	let canvas = document.createElement ('canvas');
	canvas.width = width;
	canvas.height = height;
	
	let context = canvas.getContext ('2d');
	context.drawImage (image, 0, 0, width, height);
	return context.getImageData (0, 0, width, height);
};

OV.UpdateMaterialTransparency = function (material)
{
	material.transparent = false;
	if (OV.IsLower (material.opacity, 1.0)) {
		material.transparent = true;
	}
};
