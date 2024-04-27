importScripts ('https://cdn.jsdelivr.net/npm/occt-import-js@0.0.21/dist/occt-import-js.min.js');

onmessage = async function (ev)
{
	let occt = await occtimportjs ();
	let result = null;
	if (ev.data.format === 'step') {
		result = occt.ReadStepFile (ev.data.buffer, ev.data.params);
	} else if (ev.data.format === 'iges') {
		result = occt.ReadIgesFile (ev.data.buffer, ev.data.params);
	} else if (ev.data.format === 'brep') {
		result = occt.ReadBrepFile (ev.data.buffer, ev.data.params);
	}
	postMessage (result);
};
