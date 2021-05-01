let rhino3dm = require ('../../../libs/rhino3dm.min.js')
let fs = require ('fs');
let path = require ('path');

function Write3dmFileToJson (rhino, rhinoFileName, outputFolder)
{
	console.log ('Writing 3dm to json: ' + outputFolder);
	if (!fs.existsSync (outputFolder)){
		fs.mkdirSync (outputFolder);
	}
	let inputBuffer = fs.readFileSync (rhinoFileName, null).buffer;
	let inputArray = new Uint8Array (inputBuffer);
	let inputDoc = rhino.File3dm.fromByteArray (inputArray);
	let objects = inputDoc.objects ();
	for (let i = 0; i < objects.count; i++) {
		let mesh = objects.get (i).geometry ();
		if (mesh instanceof rhino.Mesh) {
			let threeJson = mesh.toThreejsJSON ();
			let jsonFileName = path.join (outputFolder, 'mesh' + i + '.json');
			fs.writeFileSync (jsonFileName, JSON.stringify (threeJson, null, 4));
		}
	}
}

function WriteJsonTo3dmFile (rhino, inputFolder)
{
	console.log ('Writing json to 3dm: ' + inputFolder);
	let outputDoc = new rhino.File3dm ();
	let fileNames = fs.readdirSync (inputFolder);
	for (let i = 0; i < fileNames.length; i++) {
		let fileName = fileNames[i];
		if (path.extname (fileName) != '.json') {
			continue;
		}
		let filePath = path.join (inputFolder, fileName);
		let fileContent = fs.readFileSync (filePath);
		let jsonContent = JSON.parse (fileContent);
		let rhinoMesh = new rhino.Mesh.createFromThreejsJSON (jsonContent);
		outputDoc.objects ().add (rhinoMesh, null);
	}
	let writeOptions = new rhino.File3dmWriteOptions ();
	writeOptions.version = 6;
	let outputBuffer = outputDoc.toByteArray (writeOptions);
	fs.writeFileSync (path.join (inputFolder, 'model.3dm'), outputBuffer);
}

if (!fs.existsSync ('output')){
	fs.mkdirSync ('output');
}

rhino3dm ().then (async function (rhinoIn) {
	Write3dmFileToJson (rhinoIn, 'input/hello_mesh.3dm', 'output/hello_mesh');
	Write3dmFileToJson (rhinoIn, 'input/one_cube.3dm', 'output/one_cube');
	Write3dmFileToJson (rhinoIn, 'input/two_cubes.3dm', 'output/two_cubes');
	Write3dmFileToJson (rhinoIn, 'input/three_cubes.3dm', 'output/three_cubes');
	rhino3dm ().then (async function (rhinoOut) {
		WriteJsonTo3dmFile (rhinoOut, 'output/hello_mesh');
		WriteJsonTo3dmFile (rhinoOut, 'output/one_cube');
		WriteJsonTo3dmFile (rhinoOut, 'output/two_cubes');
		WriteJsonTo3dmFile (rhinoOut, 'output/three_cubes');
	});
});
