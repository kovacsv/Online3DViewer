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
            onImportStart : function () {
                progressDiv.innerHTML = 'Importing model...';
            },
            onVisualizationStart : function () {
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
            onLoadError : function (importError) {
                progressDiv.innerHTML = 'Unknown error.';
            },
        });

        let modelParams = element.getAttribute ('model');
        if (!modelParams) {
            return;
        }

        let modelUrls = OV.UrlParamConverter.UrlParameterToModelUrls (modelParams);
        if (modelUrls === null || modelUrls.length === 0) {
            return;
        }

        let cameraParams = element.getAttribute ('camera');
        if (cameraParams) {
            let camera = OV.UrlParamConverter.UrlParameterToCamera (cameraParams);
            if (camera !== null) {
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
