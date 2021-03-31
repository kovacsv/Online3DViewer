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
            let camera = this.hashHandler.GetCameraFromHash ();
            if (camera !== null) {
                this.viewer.SetCamera (camera);
            }
            this.modelLoader.LoadFromUrlList (urls);
            let hashParameters = OV.CreateHashParameters (urls, camera);
            let websiteUrl = this.parameters.websiteLinkDiv.attr ('href') + '#' + hashParameters;
            this.parameters.websiteLinkDiv.attr ('href', websiteUrl);
        }
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
