importScripts ('occt-import-js.js');

onmessage = async function (ev)
{
	let occt = await occtimportjs ();
	let result = occt.ReadStepFile (ev.data);
	postMessage (result);
};
