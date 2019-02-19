ImporterViewer = function ()
{
	this.viewer = null;
	this.jsonData = null;
};

ImporterViewer.prototype.Init = function (canvasName)
{
	var viewerSettings = {
		cameraEyePosition : [8.0, -6.0, 4.0],
		cameraCenterPosition : [0.0, 0.0, 0.0],
		cameraUpVector : [0, 0, 1]
	};

	this.viewer = new JSM.ThreeViewer ();
	var canvas = document.getElementById (canvasName);
	if (!this.viewer.Start (canvas, viewerSettings)) {
		return false;
	}
	this.viewer.navigation.SetNearDistanceLimit (0.1);
	this.viewer.navigation.SetFarDistanceLimit (100000.0);
	this.viewer.SetClearColor (0xdddddd);
	this.viewer.Draw ();
	
	return true;
};

ImporterViewer.prototype.GetJsonData = function ()
{
	return this.jsonData;
};

ImporterViewer.prototype.SetJsonData = function (jsonData)
{
	this.jsonData = jsonData;
};

ImporterViewer.prototype.RemoveMeshes = function ()
{
	this.viewer.RemoveMeshes ();
};

ImporterViewer.prototype.ShowAllMeshes = function (inEnvironment)
{
	this.RemoveMeshes ();
	
	var myThis = this;
	var currentMeshIndex = 0;
	var environment = {
		onStart : function (taskCount/*, meshes*/) {
			inEnvironment.onStart (taskCount);
			myThis.viewer.EnableDraw (false);
		},
		onProgress : function (currentTask, meshes) {
			while (currentMeshIndex < meshes.length) {
				myThis.viewer.AddMesh (meshes[currentMeshIndex]);
				currentMeshIndex = currentMeshIndex + 1;
			}
			inEnvironment.onProgress (currentTask);
		},
		onFinish : function (meshes) {
			myThis.AdjustClippingPlanes (50.0);
			myThis.FitInWindow ();
			myThis.viewer.EnableDraw (true);
			myThis.viewer.Draw ();
			inEnvironment.onFinish (meshes);
		}
	};
	
	JSM.ConvertJSONDataToThreeMeshes (this.jsonData, this.Draw.bind (this), environment);
};

ImporterViewer.prototype.GetMeshesUnderPosition = function (x, y)
{
	var objects = this.viewer.GetObjectsUnderPosition (x, y);
	var meshes = [];
	var i;
	for (i = 0; i < objects.length; i++) {
		if (objects[i].object instanceof THREE.Mesh) {
			meshes.push (objects[i].object);
		}
	}
	return meshes;
};

ImporterViewer.prototype.ShowMesh = function (index, show)
{
	this.viewer.scene.traverse (function (current) {
		if (current instanceof THREE.Mesh) {
			if (current.originalJsonMeshIndex == index) {
				if (show) {
					current.visible = true;
				} else {
					current.visible = false;
				}
			}
		}
	});
};

ImporterViewer.prototype.GetMeshesByMaterial = function (materialIndex)
{
	var meshIndices = [];
	this.viewer.scene.traverse (function (current) {
		if (current instanceof THREE.Mesh) {
			if (current.originalJsonMaterialIndex == materialIndex) {
				if (meshIndices.length === 0 || meshIndices[meshIndices.length - 1] != current.originalJsonMeshIndex) {
					meshIndices.push (current.originalJsonMeshIndex);
				}
			}
		}
	});
	return meshIndices;
};

ImporterViewer.prototype.HighlightMesh = function (index, highlight)
{
	this.viewer.scene.traverse (function (current) {
		if (current instanceof THREE.Mesh) {
			if (current.originalJsonMeshIndex == index) {
				if (highlight) {
					current.material.emissive.setHex (0x555555);
				} else {
					current.material.emissive.setHex (0);
				}
			}
		}
	});
};

ImporterViewer.prototype.FitInWindow = function ()
{
	this.viewer.FitInWindow ();
};

ImporterViewer.prototype.FitMeshInWindow = function (index)
{
	var meshes = [];
	this.viewer.scene.traverse (function (current) {
		if (current instanceof THREE.Mesh) {
			if (current.originalJsonMeshIndex == index) {
				meshes.push (current);
			}
		}
	});
	this.viewer.FitMeshesInWindow (meshes);
};

ImporterViewer.prototype.FitMeshesInWindow = function (meshIndices)
{
	var meshes = [];
	this.viewer.scene.traverse (function (current) {
		if (current instanceof THREE.Mesh) {
			if (meshIndices.indexOf (current.originalJsonMeshIndex) != -1) {
				meshes.push (current);
			}
		}
	});
	this.viewer.FitMeshesInWindow (meshes);
};

ImporterViewer.prototype.AdjustClippingPlanes = function ()
{
	if (this.viewer.MeshCount () > 0) {
		this.viewer.AdjustClippingPlanes (50.0);
	}
};

ImporterViewer.prototype.SetFixUp = function ()
{
	this.viewer.navigation.EnableFixUp (!this.viewer.navigation.cameraFixUp);
};

ImporterViewer.prototype.SetNamedView = function (viewName)
{
	var eye, center, up;
	if (viewName == 'z') {
		eye = new JSM.Coord (1.0, 0.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (0.0, 0.0, 1.0);
	} else if (viewName == '-z') {
		eye = new JSM.Coord (-1.0, 0.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (0.0, 0.0, -1.0);
	} else if (viewName == 'y') {
		eye = new JSM.Coord (1.0, 0.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (0.0, 1.0, 0.0);
	} else if (viewName == '-y') {
		eye = new JSM.Coord (-1.0, 0.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (0.0, -1.0, 0.0);
	} else if (viewName == 'x') {
		eye = new JSM.Coord (0.0, 1.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (1.0, 0.0, 0.0);
	} else if (viewName == '-x') {
		eye = new JSM.Coord (0.0, -1.0, 0.0);
		center = new JSM.Coord (0.0, 0.0, 0.0);
		up = new JSM.Coord (-1.0, 0.0, 0.0);
	} else {
		return;
	}

	this.viewer.cameraMove.Set (eye, center, up);
	this.viewer.FitInWindow ();
};

ImporterViewer.prototype.Draw = function ()
{
	this.viewer.Draw ();
};
