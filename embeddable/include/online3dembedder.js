function Online3DViewerLoad ()
{
	function LoadViewer (viewerElement)
	{
		var urls = viewerElement.getAttribute ('sourcefiles');
		if (urls === undefined || urls === null) {
			return;
		}

		var viewerSettings = {
			cameraEyePosition : [6.0, -5.5, 4.0],
			cameraCenterPosition : [0.0, 0.0, 0.0],
			cameraUpVector : [0.0, 0.0, 1.0]
		};

		var viewer = new JSM.ThreeViewer ();
		if (!viewer.Start (viewerElement, viewerSettings)) {
			return;
		}

		var myThis = this;
		var urlList = urls.split ('|');
		JSM.ConvertURLListToJsonData (urlList, {
			onError : function () {
				return;
			},
			onReady : function (fileNames, jsonData) {
				var currentMeshIndex = 0;
				var environment = new JSM.AsyncEnvironment ({
					onStart : function (taskCount/*, meshes*/) {
						viewer.EnableDraw (false);
					},
					onProcess : function (currentTask, meshes) {
						while (currentMeshIndex < meshes.length) {
							viewer.AddMesh (meshes[currentMeshIndex]);
							currentMeshIndex = currentMeshIndex + 1;
						}
					},
					onFinish : function (meshes) {
						if (meshes.length > 0) {
							viewer.AdjustClippingPlanes (50.0);
							viewer.FitInWindow ();
						}
						viewer.EnableDraw (true);
						viewer.Draw ();
					}
				});
				JSM.ConvertJSONDataToThreeMeshes (jsonData, null, environment);	
			}				
		});
	}

	var viewers = document.getElementsByClassName ('3dviewer');
	var i;
	for (i = 0; i < viewers.length; i++) {
		LoadViewer (viewers[i]);
	}
}

window.addEventListener ('load', Online3DViewerLoad, true);
