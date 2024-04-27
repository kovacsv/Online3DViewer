importScripts ('occt-import-js.js');

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
