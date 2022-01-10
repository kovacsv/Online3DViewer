import { CreateModelUrlParameters } from '../engine/parameters/parameterlist.js';
import { FileSource, TransformFileHostUrls } from '../engine/io/fileutils.js';
import { ImportSettings } from '../engine/import/importer.js';
import { AddDomElement } from '../engine/viewer/domutils.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { HashHandler } from './hashhandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';

export class Embed
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.viewer = new Viewer ();
        this.hashHandler = new HashHandler ();
        this.modelLoaderUI = new ThreeModelLoaderUI ();
    }

    Load ()
    {
        let canvas = AddDomElement (this.parameters.viewerDiv, 'canvas');
        this.InitViewer (canvas);
        this.Resize ();

        if (this.hashHandler.HasHash ()) {
        let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            TransformFileHostUrls (urls);
            let background = this.hashHandler.GetBackgroundFromHash ();
            if (background !== null) {
                this.viewer.SetBackgroundColor (background);
            }
            let edgeSettings = this.hashHandler.GetEdgeSettingsFromHash ();
            if (edgeSettings !== null) {
                this.viewer.SetEdgeSettings (
                    edgeSettings.showEdges,
                    edgeSettings.edgeColor,
                    edgeSettings.edgeThreshold
                );
            }
            let settings = new ImportSettings ();
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                settings.defaultColor = defaultColor;
            }
            this.modelLoaderUI.LoadModel (urls, FileSource.Url, settings, {
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
            let hashParameters = CreateModelUrlParameters (urls);
            let websiteUrl = this.parameters.websiteLinkDiv.getAttribute ('href') + '#' + hashParameters;
            this.parameters.websiteLinkDiv.setAttribute ('href', websiteUrl);
        }

		window.addEventListener ('resize', () => {
			this.Resize ();
		});
    }

    Resize ()
    {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
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
        this.viewer.Init (canvas);
        this.viewer.SetEnvironmentMap ([
            'assets/envmaps/grayclouds/posx.jpg',
            'assets/envmaps/grayclouds/negx.jpg',
            'assets/envmaps/grayclouds/posy.jpg',
            'assets/envmaps/grayclouds/negy.jpg',
            'assets/envmaps/grayclouds/posz.jpg',
            'assets/envmaps/grayclouds/negz.jpg'
        ]);
    }
}
