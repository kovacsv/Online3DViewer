OV.Init3DViewerElements = function ()
{
    function LoadElement (element)
    {
        let canvas = document.createElement ('canvas');
        element.appendChild (canvas);

        let viewer = new OV.Viewer ();
        viewer.Init (canvas);

        let width = parseInt (element.getAttribute ('width'));
        let height = parseInt (element.getAttribute ('height'));
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        viewer.Resize (width, height);

        let loader = new OV.ThreeModelLoader ();
        let progressDiv = null;
        loader.Init ({
            onLoadStart : function () {
                canvas.style.display = 'none';
                progressDiv = document.createElement ('div');
                element.appendChild (progressDiv);
                progressDiv.innerHTML = 'Loading model...';
            },
            onFilesLoaded : function () {
                progressDiv.innerHTML = 'Importing model...';
            },
            onModelImported : function () {
                progressDiv.innerHTML = 'Visualizing model...';
            },
            onModelFinished : function (importResult, threeMeshes) {
                element.removeChild (progressDiv);
                canvas.style.display = 'initial';
                viewer.AddMeshes (threeMeshes);
                let boundingSphere = viewer.GetBoundingSphere (function (meshUserData) {
                    return true;
                });
                viewer.AdjustClippingPlanes (boundingSphere);
                viewer.FitToWindow (boundingSphere, false);        						
            },
            onTextureLoaded : function () {
                viewer.Render ();
            },
            onLoadError : function (importerError) {
                progressDiv.innerHTML = 'Unknown error.';
            },
        });

        let model = element.getAttribute ('model');
        if (!model) {
            return;
        }

        let modelUrls = model.split (',');
        if (modelUrls.length === 0) {
            return;
        }

        let camera = element.getAttribute ('camera');
        if (camera) {
            let cameraParams = camera.split (',');
            if (cameraParams.length === 9) {
                let camera = new OV.Camera (
                    new OV.Coord3D (parseFloat (cameraParams[0]), parseFloat (cameraParams[1]), parseFloat (cameraParams[2])),
                    new OV.Coord3D (parseFloat (cameraParams[3]), parseFloat (cameraParams[4]), parseFloat (cameraParams[5])),
                    new OV.Coord3D (parseFloat (cameraParams[6]), parseFloat (cameraParams[7]), parseFloat (cameraParams[8]))
                );
                viewer.SetCamera (camera);
            }
        }

        loader.LoadFromUrlList (modelUrls);
    }

    window.addEventListener ('load', function () {
        let elements = document.getElementsByClassName ('online_3d_viewer');
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            LoadElement (element);
        }
    });
};
