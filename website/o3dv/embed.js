OV.Embed = class
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.viewer = new OV.Viewer ();
        this.hashHandler = new OV.HashHandler ();
        this.modelLoader = new OV.ThreeModelLoader ();
    }

    Load ()
    {
        let canvas = $('<canvas>').appendTo (this.parameters.viewerDiv);
        this.viewer.Init (canvas.get (0));
        this.InitModelLoader ();
        this.Resize ();

        if (this.hashHandler.HasHash ()) {
            let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            let settings = new OV.ImportSettings ();
            let color = this.hashHandler.GetColorFromHash ();
            if (color !== null) {
                settings.defaultColor = color;
            }            
            this.modelLoader.LoadFromUrlList (urls, settings);
            let hashParameters = OV.CreateModelUrlParameters (urls);
            let websiteUrl = this.parameters.websiteLinkDiv.attr ('href') + '#' + hashParameters;
            this.parameters.websiteLinkDiv.attr ('href', websiteUrl);
        }

        let obj = this;
		$(window).on ('resize', function () {
			obj.Resize ();
		});        
    }

    Resize ()
    {
        let windowWidth = $(window).outerWidth ();
        let windowHeight = $(window).outerHeight ();
        this.viewer.Resize (windowWidth, windowHeight);
    }

    OnModelFinished (importResult, threeMeshes)
    {
        this.viewer.AddMeshes (threeMeshes);
        let boundingSphere = this.viewer.GetBoundingSphere (function (meshUserData) {
            return true;
        });
        this.viewer.AdjustClippingPlanes (boundingSphere);
        let camera = this.hashHandler.GetCameraFromHash ();
        if (camera !== null) {
            this.viewer.SetCamera (camera);
        } else {
            this.viewer.SetUpVector (importResult.upVector, false);
        }
        this.viewer.FitToWindow (boundingSphere, false);        
    }    

    InitModelLoader ()
    {
        let obj = this;
        OV.InitModelLoader (this.modelLoader, {
            onStart : function ()
            {
                
            },
            onFinish : function (importResult, threeMeshes)
            {
                obj.OnModelFinished (importResult, threeMeshes);
            },
            onRender : function ()
            {
                obj.viewer.Render ();
            }
        });
    } 
};
