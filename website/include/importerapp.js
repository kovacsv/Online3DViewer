ExtensionInterface = function (app)
{
	this.app = app;
};

ExtensionInterface.prototype.GetButtonsDiv = function ()
{
	return this.app.extensionButtons.GetButtonsDiv ();
};

ExtensionInterface.prototype.GetModelJson = function ()
{
	return this.app.viewer.GetJsonData ();
};

ImporterApp = function ()
{
	this.viewer = null;
	this.fileNames = null;
	this.inGenerate = false;
	this.extensions = [];
	this.importerButtons = null;
	this.extensionButtons = null;
	this.aboutDialog = null;
	this.readyForTest = null;
};

ImporterApp.prototype.Init = function ()
{
	if (!JSM.IsWebGLEnabled () || !JSM.IsFileApiEnabled ()) {
		while (document.body.lastChild) {
			document.body.removeChild (document.body.lastChild);
		}

		var div = $('<div>').addClass ('nosupport').appendTo ($('body'));
		div.html ([
			'<div id="nosupport">',
			this.GetWelcomeText (),
			'<div class="nosupporterror">You need a browser which supports the following technologies: WebGL, WebGLRenderingContext, File, FileReader, FileList, Blob, URL.</div>',
			'</div>'
		].join (''));
		return;
	}
	
	var myThis = this;
	var top = document.getElementById ('top');
	this.importerButtons = new ImporterButtons (top);
	this.importerButtons.AddLogo ('Online 3D Viewer <span class="version">v 0.5.2</span>', function () { myThis.ShowAboutDialog (); });
	this.importerButtons.AddButton ('images/openfile.png', 'Open File', function () { myThis.OpenFile (); });
	this.importerButtons.AddButton ('images/fitinwindow.png', 'Fit In Window', function () { myThis.FitInWindow (); });
	this.importerButtons.AddToggleButton ('images/fixup.png', 'images/fixupgray.png', 'Enable/Disable Fixed Up Vector', function () { myThis.SetFixUp (); });
	this.importerButtons.AddButton ('images/top.png', 'Set Up Vector (Z)', function () { myThis.SetNamedView ('z'); });
	this.importerButtons.AddButton ('images/bottom.png', 'Set Up Vector (-Z)', function () { myThis.SetNamedView ('-z'); });
	this.importerButtons.AddButton ('images/front.png', 'Set Up Vector (Y)', function () { myThis.SetNamedView ('y'); });
	this.importerButtons.AddButton ('images/back.png', 'Set Up Vector (-Y)', function () { myThis.SetNamedView ('-y'); });
	this.importerButtons.AddButton ('images/left.png', 'Set Up Vector (X)', function () { myThis.SetNamedView ('x'); });
	this.importerButtons.AddButton ('images/right.png', 'Set Up Vector (-X)', function () { myThis.SetNamedView ('-x'); });
	
	this.extensionButtons = new ExtensionButtons (top);
	this.aboutDialog = new FloatingDialog ();

	window.addEventListener ('resize', this.Resize.bind (this), false);
	this.Resize ();

	this.viewer = new ImporterViewer ();
	this.viewer.Init ('example');

	window.addEventListener ('dragover', this.DragOver.bind (this), false);
	window.addEventListener ('drop', this.Drop.bind (this), false);
	
	var fileInput = document.getElementById ('file');
	fileInput.addEventListener ('change', this.FileSelected.bind (this), false);
	
	window.onhashchange = this.LoadFilesFromHash.bind (this);
	var hasHashModel = this.LoadFilesFromHash ();
	if (!hasHashModel) {
		this.ShowAboutDialog ();
	}
};

ImporterApp.prototype.ClearReadyForTest = function ()
{
	if (this.readyForTest !== null) {
		this.readyForTest.remove ();
		this.readyForTest = null;
	}
};

ImporterApp.prototype.SetReadyForTest = function ()
{
	this.readyForTest = $('<div>').attr ('id', 'readyfortest').hide ().appendTo ($('body'));
};

ImporterApp.prototype.AddExtension = function (extension)
{
	if (!extension.IsEnabled ()) {
		return;
	}
	
	var extInterface = new ExtensionInterface (this);
	extension.Init (extInterface);
};

ImporterApp.prototype.ShowAboutDialog = function ()
{
	var dialogText = [
		'<div class="importerdialog">',
		this.GetWelcomeText (),
		'</div>',
	].join ('');
	this.aboutDialog.Open ({
		title : 'Welcome',
		text : dialogText,
		buttons : [
			{
				text : 'ok',
				callback : function (dialog) {
					dialog.Close ();
				}
			}
		]
	});
};

ImporterApp.prototype.GetWelcomeText = function ()
{
	var welcomeText = [
		'<div class="welcometitle">Welcome to Online 3D Viewer!</div>',
		'<div class="welcometext">Here you can view your local 3D models online. You have three ways to open a file. Use the open button above to select files, simply drag and drop files to this browser window, or define the url of the files as location hash.</div>',
		'<div class="welcometextformats">Supported formats: 3ds, obj, stl.</div>',
		'<div class="welcometext">Powered by <a target="_blank" href="https://github.com/mrdoob/three.js/">Three.js</a> and <a target="_blank" href="https://github.com/kovacsv/JSModeler">JSModeler</a>.</div>',
		'<div class="welcometext"><a target="_blank" href="https://github.com/kovacsv/Online3DViewer"><img src="images/githublogo.png"/></a></div>',
	].join ('');
	return welcomeText;
};

ImporterApp.prototype.Resize = function ()
{
	function SetWidth (elem, value)
	{
		elem.width = value;
		elem.style.width = value + 'px';
	}

	function SetHeight (elem, value)
	{
		elem.height = value;
		elem.style.height = value + 'px';
	}

	var top = document.getElementById ('top');
	var left = document.getElementById ('left');
	var canvas = document.getElementById ('example');
	var height = document.body.clientHeight - top.offsetHeight;

	SetHeight (canvas, 0);
	SetWidth (canvas, 0);

	SetHeight (left, height);

	SetHeight (canvas, height);
	SetWidth (canvas, document.body.clientWidth - left.offsetWidth);
	
	this.aboutDialog.Resize ();
};

ImporterApp.prototype.JsonLoaded = function (progressBar)
{
	var jsonData = this.viewer.GetJsonData ();
	this.meshVisibility = {};
	var i;
	for (i = 0; i < jsonData.meshes.length; i++) {
		this.meshVisibility[i] = true;
	}

	this.Generate (progressBar);
};

ImporterApp.prototype.GenerateMenu = function ()
{
	function AddDefaultGroup (menu, name, id)
	{
		var group = menu.AddGroup (name, {
			id : id,
			openCloseButton : {
				title : 'Show/Hide ' + name
			}
		});
		return group;
	}

	function AddInformation (infoGroup, jsonData)
	{
		var infoTable = new InfoTable (infoGroup.GetContentDiv ());

		var materialCount = jsonData.materials.length;
		var vertexCount = 0;
		var triangleCount = 0;
		
		var i, j, mesh, triangles;
		for (i = 0; i < jsonData.meshes.length; i++) {
			mesh = jsonData.meshes[i];
			vertexCount += mesh.vertices.length / 3;
			for (j = 0; j < mesh.triangles.length; j++) {
				triangles = mesh.triangles[j];
				triangleCount += triangles.parameters.length / 9;
			}
		}
	
		infoTable.AddRow ('Material count', materialCount);	
		infoTable.AddRow ('Vertex count', vertexCount);	
		infoTable.AddRow ('Triangle count', triangleCount);	
	}
	
	function AddMaterial (importerMenu, materialsGroup, material)
	{
		materialsGroup.AddSubItem (material.name, {
			openCloseButton : {
				onOpen : function (contentDiv, material) {
					contentDiv.empty ();
					var table = new InfoTable (contentDiv);
					table.AddColorRow ('Ambient', material.ambient);
					table.AddColorRow ('Diffuse', material.diffuse);
					table.AddColorRow ('Specular', material.specular);
					table.AddRow ('Shininess', material.shininess.toFixed (2));
					table.AddRow ('Opacity', material.opacity.toFixed (2));
				},
				title : 'Show/Hide Information',
				userData : material
			}
		});
	}

	function AddMesh (importerApp, importerMenu, meshesGroup, mesh, meshIndex)
	{
		meshesGroup.AddSubItem (mesh.name, {
			openCloseButton : {
				onOpen : function (contentDiv, mesh) {
					contentDiv.empty ();
					var table = new InfoTable (contentDiv);
					
					var min = new JSM.Coord (JSM.Inf, JSM.Inf, JSM.Inf);
					var max = new JSM.Coord (-JSM.Inf, -JSM.Inf, -JSM.Inf);
					var i, vertex;
					for (i = 0; i < mesh.vertices.length; i =  i + 3) {
						vertex = new JSM.Coord (mesh.vertices[i], mesh.vertices[i + 1], mesh.vertices[i + 2]);
						min.x = JSM.Minimum (min.x, vertex.x);
						min.y = JSM.Minimum (min.y, vertex.y);
						min.z = JSM.Minimum (min.z, vertex.z);
						max.x = JSM.Maximum (max.x, vertex.x);
						max.y = JSM.Maximum (max.y, vertex.y);
						max.z = JSM.Maximum (max.z, vertex.z);
					}
					table.AddRow ('X Size', (max.x - min.x).toFixed (2));
					table.AddRow ('Y Size', (max.y - min.y).toFixed (2));
					table.AddRow ('Z Size', (max.z - min.z).toFixed (2));
					
					var triangleCount = 0;
					var triangles;
					for (i = 0; i < mesh.triangles.length; i++) {
						triangles = mesh.triangles[i];
						triangleCount += triangles.parameters.length / 9;
					}
				
					table.AddRow ('Vertex count', mesh.vertices.length / 3);
					table.AddRow ('Triangle count', triangleCount);
				},
				title : 'Show/Hide Information',
				userData : mesh
			},
			userButtons : [
				{
					id : 'showhidemesh-' + meshIndex,
					onCreate : function (image) {
						image.attr ('src', 'images/visible.png');
					},
					onClick : function (image, meshIndex) {
						var visible = importerApp.ShowHideMesh (meshIndex);
						image.attr ('src', visible ? 'images/visible.png' : 'images/hidden.png');
					},
					title : 'Show/Hide Mesh',
					userData : meshIndex
				}
			]
		});
	}
	
	var jsonData = this.viewer.GetJsonData ();
	var menu = $('#menu');
	var importerMenu = new ImporterMenu (menu);

	var filesGroup = AddDefaultGroup (importerMenu, 'Files', 'filesmenuitem');
	filesGroup.AddSubItem (this.fileNames.main);
	var i;
	for (i = 0; i < this.fileNames.requested.length; i++) {
		filesGroup.AddSubItem (this.fileNames.requested[i]);
	}
	
	if (this.fileNames.missing.length > 0) {
		var missingFilesGroup = AddDefaultGroup (importerMenu, 'Missing Files', 'missingfilesmenuitem');
		for (i = 0; i < this.fileNames.missing.length; i++) {
			missingFilesGroup.AddSubItem (this.fileNames.missing[i]);
		}
	}
	
	var infoGroup = AddDefaultGroup (importerMenu, 'Information', 'informationmenuitem');
	AddInformation (infoGroup, jsonData);
	
	var materialsGroup = AddDefaultGroup (importerMenu, 'Materials', 'materialsmenuitem');
	var material;
	for (i = 0; i < jsonData.materials.length; i++) {
		material = jsonData.materials[i];
		AddMaterial (importerMenu, materialsGroup, material);
	}
	
	var meshesGroup = AddDefaultGroup (importerMenu, 'Meshes', 'meshesmenuitem');
	var mesh;
	for (i = 0; i < jsonData.meshes.length; i++) {
		mesh = jsonData.meshes[i];
		AddMesh (this, importerMenu, meshesGroup, mesh, i);
	}
};

ImporterApp.prototype.GenerateError = function (errorMessage)
{
	this.viewer.RemoveMeshes ();
	var menu = $('#menu');
	menu.empty ();
	
	this.aboutDialog.Open ({
		title : 'Error',
		text : '<div class="importerdialog">' + errorMessage + '</div>',
		buttons : [
			{
				text : 'ok',
				callback : function (dialog) {
					dialog.Close ();
				}
			}
		]
	});	
};

ImporterApp.prototype.Generate = function (progressBar)
{
	function ShowMeshes (importerApp, progressBar, merge)
	{
		importerApp.inGenerate = true;
		var environment = {
			onStart : function (taskCount) {
				progressBar.Init (taskCount);
			},
			onProgress : function (currentTask) {
				progressBar.Step (currentTask + 1);
			},
			onFinish : function () {
				importerApp.GenerateMenu ();
				importerApp.inGenerate = false;
				importerApp.SetReadyForTest ();
			}
		};
		
		if (merge) {
			var jsonData = importerApp.viewer.GetJsonData ();
			importerApp.viewer.SetJsonData (JSM.MergeJsonDataMeshes (jsonData));
		}
		importerApp.viewer.ShowAllMeshes (environment);
	}

	var jsonData = this.viewer.GetJsonData ();
	if (jsonData.materials.length === 0 || jsonData.meshes.length === 0) {
		this.GenerateError ('Failed to open file. Maybe something is wrong with your file.');
		this.SetReadyForTest ();
		return;
	}
	
	var myThis = this;
	if (jsonData.meshes.length > 250) {
		this.aboutDialog.Open ({
			title : 'Information',
			text : '<div class="importerdialog">The model contains a large number of meshes. It can cause performance problems. Would you like to merge meshes?</div>',
			buttons : [
				{
					text : 'yes',
					callback : function (dialog) {
						ShowMeshes (myThis, progressBar, true);
						dialog.Close ();
					}
				},
				{
					text : 'no',
					callback : function (dialog) {
						ShowMeshes (myThis, progressBar, false);
						dialog.Close ();
					}
				}				
			]
		});
	} else {
		ShowMeshes (myThis, progressBar, false);
	}
};

ImporterApp.prototype.FitInWindow = function ()
{
	this.viewer.FitInWindow ();
};

ImporterApp.prototype.SetFixUp = function ()
{
	this.viewer.SetFixUp ();
};

ImporterApp.prototype.SetNamedView = function (viewName)
{
	this.viewer.SetNamedView (viewName);
};

ImporterApp.prototype.SetView = function (viewType)
{
	this.viewer.SetView (viewType);
};

ImporterApp.prototype.ShowHideMesh = function (meshIndex)
{
	this.meshVisibility[meshIndex] = !this.meshVisibility[meshIndex];
	if (this.meshVisibility[meshIndex]) {
		this.viewer.ShowMesh (meshIndex);
	} else {
		this.viewer.HideMesh (meshIndex);
	}
	return this.meshVisibility[meshIndex];
};

ImporterApp.prototype.ProcessFiles = function (fileList, isUrl)
{
	this.ClearReadyForTest ();
	this.aboutDialog.Close ();
	if (this.inGenerate) {
		return;
	}

	var userFiles = fileList;
	if (userFiles.length === 0) {
		return;
	}
	
	this.fileNames = null;
	
	var myThis = this;
	var processorFunc = JSM.ConvertFileListToJsonData;
	if (isUrl) {
		processorFunc = JSM.ConvertURLListToJsonData;
	}

	var menu = $('#menu');
	menu.empty ();
	if (isUrl) {
		menu.html ('Downloading files...');
	} else {
		menu.html ('Loading files...');
	}
	
	processorFunc (userFiles, {
		onError : function () {
			myThis.GenerateError ('No readable file found. You can open 3ds, obj and stl files.');
			myThis.SetReadyForTest ();
			return;
		},
		onReady : function (fileNames, jsonData) {
			myThis.fileNames = fileNames;
			myThis.viewer.SetJsonData (jsonData);
			menu.empty ();
			var progressBar = new ImporterProgressBar (menu);
			myThis.JsonLoaded (progressBar);
		}
	});
};

ImporterApp.prototype.DragOver = function (event)
{
	event.stopPropagation ();
	event.preventDefault ();
	event.dataTransfer.dropEffect = 'copy';
};

ImporterApp.prototype.Drop = function (event)
{
	event.stopPropagation ();
	event.preventDefault ();
	this.ResetHash ();
	this.ProcessFiles (event.dataTransfer.files, false);
};

ImporterApp.prototype.FileSelected = function (event)
{
	event.stopPropagation ();
	event.preventDefault ();
	this.ResetHash ();
	this.ProcessFiles (event.target.files, false);
};

ImporterApp.prototype.OpenFile = function ()
{
	var fileInput = document.getElementById ('file');
	fileInput.click ();
};

ImporterApp.prototype.ResetHash = function ()
{
	if (window.location.hash.length > 1) {
		window.location.hash = '';
	}
};

ImporterApp.prototype.LoadFilesFromHash = function ()
{
	if (window.location.hash.length < 2) {
		return false;
	}
	
	var hash = window.location.hash;
	var hash = hash.substr (1, hash.length - 1);
	var fileList = hash.split (',');
	this.ProcessFiles (fileList, true);
	return true;
};

window.onload = function ()
{
	var importerApp = new ImporterApp ();
	importerApp.Init ();
	// ExtensionIncludes
	importerApp.AddExtension (new ExampleExtension ());
	// ExtensionIncludesEnd
};
