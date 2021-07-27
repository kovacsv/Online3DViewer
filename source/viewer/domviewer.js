OV.Init3DViewerElement = function (parentDiv, modelUrls, parameters)
{
    if (!parameters) {
        parameters = {};
    }
    
    let canvas = document.createElement ('canvas');
    parentDiv.appendChild (canvas);

    let viewer = new OV.Viewer ();
    viewer.Init (canvas);

    let width = parentDiv.clientWidth;
    let height = parentDiv.clientHeight;
    viewer.Resize (width, height);

    let loader = new OV.ThreeModelLoader ();
    let progressDiv = null;
    loader.Init ({
        onLoadStart : () => {
            canvas.style.display = 'none';
            progressDiv = document.createElement ('div');
            parentDiv.appendChild (progressDiv);
            progressDiv.innerHTML = 'Loading model...';
        },
        onImportStart : () => {
            progressDiv.innerHTML = 'Importing model...';
        },
        onVisualizationStart : () => {
            progressDiv.innerHTML = 'Visualizing model...';
        },
        onModelFinished : (importResult, threeMeshes) => {
            parentDiv.removeChild (progressDiv);
            canvas.style.display = 'inherit';
            viewer.AddMeshes (threeMeshes);
            let boundingSphere = viewer.GetBoundingSphere ((meshUserData) => {
                return true;
            });
            viewer.AdjustClippingPlanesToSphere (boundingSphere);
            if (parameters.camera) {
                viewer.SetCamera (parameters.camera);
            } else {
                viewer.SetUpVector (importResult.upVector, false);
            }
            viewer.FitSphereToWindow (boundingSphere, false);                                
        },
        onTextureLoaded : () => {
            viewer.Render ();
        },
        onLoadError : (importError) => {
            let message = 'Unknown error';
            if (importError.code === OV.ImportErrorCode.NoImportableFile) {
                message = 'No importable file found';
            } else if (importError.code === OV.ImportErrorCode.ImportFailed) {
                message = 'Failed to import model.';
            }
            if (importError.message !== null) {
                message += ' (' + importError.message + ')';
            }
            progressDiv.innerHTML = message;
        }
    });

    if (modelUrls === null || modelUrls.length === 0) {
        return null;
    }

    if (parameters.backgroundColor) {
        viewer.SetBackgroundColor (parameters.backgroundColor);
    }

    if (parameters.environmentMap) {
        viewer.SetEnvironmentMap (parameters.environmentMap);
    }

    let settings = new OV.ImportSettings ();
    if (parameters.defaultColor) {
        settings.defaultColor = parameters.defaultColor;
    }

    loader.LoadFromUrlList (modelUrls, settings);
    return {
        element: parentDiv,
        viewer: viewer
    };
};

OV.Init3DViewerElements = function (onReady)
{
    function LoadElement (element)
    {
        let camera = null;
        let cameraParams = element.getAttribute ('camera');
        if (cameraParams) {
            camera = OV.ParameterConverter.StringToCamera (cameraParams);
        }

        let backgroundColor = null;
        let backgroundColorParams = element.getAttribute ('backgroundcolor');
        if (backgroundColorParams) {
            backgroundColor = OV.ParameterConverter.StringToColor (backgroundColorParams);
        }

        let defaultColor = null;
        let defaultColorParams = element.getAttribute ('defaultcolor');
        if (defaultColorParams) {
            defaultColor = OV.ParameterConverter.StringToColor (defaultColorParams);
        }

        let environmentMap = null;
        let environmentMapParams = element.getAttribute ('environmentmap');
        if (environmentMapParams) {
            let environmentMapParts = environmentMapParams.split (',');
            if (environmentMapParts.length === 6) {
                environmentMap = environmentMapParts; 
            }
        }

        let modelUrls = null;
        let modelParams = element.getAttribute ('model');
        if (modelParams) {
            modelUrls = OV.ParameterConverter.StringToModelUrls (modelParams);
        }

        return OV.Init3DViewerElement (element, modelUrls, {
            camera,
            backgroundColor,
            defaultColor,
            environmentMap
        });
    }

    let viewerElements = [];
    window.addEventListener ('load', () => {
        let elements = document.getElementsByClassName ('online_3d_viewer');
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            let viewerElement = LoadElement (element);
            viewerElements.push (viewerElement);
        }
        if (onReady !== undefined && onReady !== null) {
            onReady (viewerElements);
        }
    }); 

    window.addEventListener ('resize', () => {
        for (let i = 0; i < viewerElements.length; i++) {
            let viewerElement = viewerElements[i];
            let width = viewerElement.element.clientWidth;
            let height = viewerElement.element.clientHeight;
            viewerElement.viewer.Resize (width, height);    
        }
    });
};
