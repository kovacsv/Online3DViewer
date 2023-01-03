import { CreateModelUrlParameters } from '../engine/parameters/parameterlist.js';
import { TransformFileHostUrls } from '../engine/io/fileutils.js';
import { ImportSettings } from '../engine/import/importer.js';
import { AddDomElement } from '../engine/viewer/domutils.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { HashHandler } from './hashhandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';
import { Direction } from '../engine/geometry/geometry.js';
import { InputFilesFromUrls } from '../engine/import/importerfiles.js';
import { EnvironmentSettings } from '../engine/viewer/shadingmodel.js';

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
        this.viewer.Init (canvas);
        this.Resize ();

        if (this.hashHandler.HasHash ()) {
            let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            TransformFileHostUrls (urls);

            let envMapName = 'fishermans_bastion';
            let bgIsEnvMap = false;
            let environmentSettingsObj = this.hashHandler.GetEnvironmentSettingsFromHash ();
            if (environmentSettingsObj !== null) {
                envMapName = environmentSettingsObj.environmentMapName;
                bgIsEnvMap = environmentSettingsObj.backgroundIsEnvMap;
            }
            let envMapPath = 'assets/envmaps/' + envMapName + '/';
            let envMapTextures = [
                envMapPath + 'posx.jpg',
                envMapPath + 'negx.jpg',
                envMapPath + 'posy.jpg',
                envMapPath + 'negy.jpg',
                envMapPath + 'posz.jpg',
                envMapPath + 'negz.jpg'
            ];
            let environmentSettings = new EnvironmentSettings (envMapTextures, bgIsEnvMap);
            this.viewer.SetEnvironmentMapSettings (environmentSettings);

            let cameraMode = this.hashHandler.GetCameraModeFromHash ();
            if (cameraMode !== null) {
                this.viewer.SetCameraMode (cameraMode);
            }
            let background = this.hashHandler.GetBackgroundFromHash ();
            if (background !== null) {
                this.viewer.SetBackgroundColor (background);
            }
            let edgeSettings = this.hashHandler.GetEdgeSettingsFromHash ();
            if (edgeSettings !== null) {
                this.viewer.SetEdgeSettings (edgeSettings);
            }
            let settings = new ImportSettings ();
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                settings.defaultColor = defaultColor;
            }
            let inputFiles = InputFilesFromUrls (urls);
            this.modelLoaderUI.LoadModel (inputFiles, settings, {
                onStart : () =>
                {

                },
                onFinish : (importResult, threeObject) =>
                {
                    this.OnModelFinished (threeObject);
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

    OnModelFinished (threeObject)
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
            this.viewer.SetUpVector (Direction.Y, false);
            this.viewer.FitSphereToWindow (boundingSphere, false);
        }
    }
}
