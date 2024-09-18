
importScripts ('occt-import-js.js');

onmessage = async function (ev)
{
	let modulOverrides = {
		locateFile: function (path) {
			return path;
		}
	};
	let occt = await occtimportjs (modulOverrides);
	let result = occt.ReadFile (ev.data.format, ev.data.buffer, ev.data.params);
	postMessage (result);
};
