OV.Init3DViewerElements = function ()
{
    function LoadElement (element)
    {
        let canvas = document.createElement ('canvas');
        element.appendChild (canvas);

        let viewer = new OV.Viewer ();
        viewer.Init (canvas);

        let width = element.clientWidth;
        let height = element.clientHeight;
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
                canvas.style.display = 'inherit';
                viewer.AddMeshes (threeMeshes);
                let boundingSphere = viewer.GetBoundingSphere (function (meshUserData) {
                    return true;
                });
                viewer.AdjustClippingPlanes (boundingSphere);
                let camera = null;
                let cameraParams = element.getAttribute ('camera');
                if (cameraParams) {
                    camera = OV.ParameterConverter.StringToCamera (cameraParams);
                }
                if (camera !== null) {
                    viewer.SetCamera (camera);
                } else {
                    viewer.SetUpVector (importResult.upVector, false);
                }
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

        let modelUrls = OV.ParameterConverter.StringToModelUrls (modelParams);
        if (modelUrls === null || modelUrls.length === 0) {
            return;
        }

        let settings = new OV.ImportSettings ();
        let colorParams = element.getAttribute ('color');
        if (colorParams) {
            let color = OV.ParameterConverter.StringToColor (colorParams);
            if (color !== null) {
                settings.defaultColor = color;
            }
        }

        loader.LoadFromUrlList (modelUrls, settings);
        return {
            element: element,
            viewer: viewer
        };
    }

    let viewerElements = [];
    window.addEventListener ('load', function () {
        let elements = document.getElementsByClassName ('online_3d_viewer');
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            let viewerElement = LoadElement (element);
            viewerElements.push (viewerElement);
        }
    }); 

    window.addEventListener ('resize', function () {
        for (let i = 0; i < viewerElements.length; i++) {
            let viewerElement = viewerElements[i];
            let width = viewerElement.element.clientWidth;
            let height = viewerElement.element.clientHeight;
            viewerElement.viewer.Resize (width, height);    
        }
    });
};
