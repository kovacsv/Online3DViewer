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
        this.InitViewer (canvas);
        this.InitModelLoader ();
        this.Resize ();

        if (this.hashHandler.HasHash ()) {
            let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            let background = this.hashHandler.GetBackgroundFromHash ();
            if (background !== null) {
                this.viewer.SetBackgroundColor (background);
            }
            let settings = new OV.ImportSettings ();
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                settings.defaultColor = defaultColor;
            }
            this.modelLoader.LoadFromUrlList (urls, settings);
            let hashParameters = OV.CreateModelUrlParameters (urls);
            let websiteUrl = this.parameters.websiteLinkDiv.attr ('href') + '#' + hashParameters;
            this.parameters.websiteLinkDiv.attr ('href', websiteUrl);
        }

		$(window).on ('resize', () => {
			this.Resize ();
		});
    }

    Resize ()
    {
        let windowWidth = $(window).outerWidth ();
        let windowHeight = $(window).outerHeight ();
        this.viewer.Resize (windowWidth, windowHeight);
    }

    OnModelFinished (importResult, threeObject)
    {
        this.viewer.SetMainObject (threeObject);
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return true;
        });
        this.viewer.AdjustClippingPlanesToSphere (boundingSphere);
        let camera = this.hashHandler.GetCameraFromHash ();
        if (camera !== null) {
            this.viewer.SetCamera (camera);
        } else {
            this.viewer.SetUpVector (importResult.upVector, false);
        }
        this.viewer.FitSphereToWindow (boundingSphere, false);
    }

    InitViewer (canvas)
    {
        this.viewer.Init (canvas.get (0));
        this.viewer.SetEnvironmentMap ([
            'assets/envmaps/forest/posx.jpg',
            'assets/envmaps/forest/negx.jpg',
            'assets/envmaps/forest/posy.jpg',
            'assets/envmaps/forest/negy.jpg',
            'assets/envmaps/forest/posz.jpg',
            'assets/envmaps/forest/negz.jpg'
        ]);
    }

    InitModelLoader ()
    {
        OV.InitModelLoader (this.modelLoader, {
            onStart : () =>
            {

            },
            onFinish : (importResult, threeObject) =>
            {
                this.OnModelFinished (importResult, threeObject);
            },
            onRender : () =>
            {
                this.viewer.Render ();
            },
            onError : (importError) =>
            {

            }
        });
    }
};
