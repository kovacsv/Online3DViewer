importScripts ('https://cdn.jsdelivr.net/npm/occt-import-js@0.0.5/dist/occt-import-js.js');

onmessage = async function (ev)
{
	let occt = await occtimportjs ();
	let result = occt.ReadStepFile (ev.data);
	postMessage (result);
};
