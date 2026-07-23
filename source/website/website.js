import { GetFileExtension, TransformFileHostUrls } from '../engine/io/fileutils.js';
import { InputFilesFromFileObjects, InputFilesFromUrls } from '../engine/import/importerfiles.js';
import { ImportErrorCode, ImportSettings } from '../engine/import/importer.js';
import { NavigationMode, ProjectionMode } from '../engine/viewer/camera.js';
import { RGBColor } from '../engine/model/color.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { AddDiv, AddDomElement, ShowDomElement, SetDomElementOuterHeight, CreateDomElement, GetDomElementOuterWidth, ClearDomElement } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToScreen, ShowListPopup } from './dialogs.js';
import { HandleEvent } from './eventhandler.js';
import { HashHandler } from './hashhandler.js';
import { Navigator, Selection, SelectionType } from './navigator.js';
import { CameraSettings, Settings, Theme } from './settings.js';
import { Sidebar } from './sidebar.js';
import { CreateDefaultSectionSettings, SectionViewPanel } from './sectionviewpanel.js';
import { ThemeHandler } from './themehandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';
import { Toolbar } from './toolbar.js';
import { DownloadModel, ShowExportDialog } from './exportdialog.js';
import { ShowSnapshotDialog } from './snapshotdialog.js';
import { AddSvgIconElement, GetFilesFromDataTransfer, InstallTooltip, IsSmallWidth } from './utils.js';
import { ShowOpenUrlDialog } from './openurldialog.js';
import { ShowSharingDialog } from './sharingdialog.js';
import { GetDefaultMaterials, ReplaceDefaultMaterialsColor } from '../engine/model/modelutils.js';
import { Direction } from '../engine/geometry/geometry.js';
import { CookieGetBoolVal, CookieSetBoolVal } from './cookiehandler.js';
import { MeasureTool } from './measuretool.js';
import { CloseAllDialogs } from './dialog.js';
import { CreateVerticalSplitter } from './splitter.js';
import { EnumeratePlugins, PluginType } from './pluginregistry.js';
import { EnvironmentSettings } from '../engine/viewer/shadingmodel.js';
import { SectionSettings } from '../engine/viewer/sectionmodel.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { Loc } from '../engine/core/localization.js';

import * as THREE from 'three';

const WebsiteUIState =
{
    Undefined : 0,
    Intro : 1,
    Model : 2,
    Loading : 3
};

class WebsiteLayouter
{
    constructor (parameters, navigator, sidebar, viewer, measureTool)
    {
        this.parameters = parameters;
        this.navigator = navigator;
        this.sidebar = sidebar;
        this.viewer = viewer;
        this.measureTool = measureTool;
        this.limits = {
            minPanelWidth : 290,
            minCanvasWidth : 100
        };
    }

    Init ()
    {
        this.InstallSplitter (this.parameters.navigatorSplitterDiv, this.parameters.navigatorDiv, (originalWidth, xDiff) => {
            let newWidth = originalWidth + xDiff;
            this.OnSplitterDragged (newWidth - this.navigator.GetWidth (), 0);
        });

        this.InstallSplitter (this.parameters.sidebarSplitterDiv, this.parameters.sidebarDiv, (originalWidth, xDiff) => {
            let newWidth = originalWidth - xDiff;
            this.OnSplitterDragged (0, newWidth - this.sidebar.GetWidth ());
        });

        this.Resize ();
    }

    InstallSplitter (splitterDiv, resizedDiv, onSplit)
    {
        let originalWidth = null;
        CreateVerticalSplitter (splitterDiv, {
            onSplitStart : () => {
                originalWidth = GetDomElementOuterWidth (resizedDiv);
            },
            onSplit : (xDiff) => {
                onSplit (originalWidth, xDiff);
            }
        });
    }

    OnSplitterDragged (leftDiff, rightDiff)
    {
        let windowWidth = window.innerWidth;

        let navigatorWidth = this.navigator.GetWidth ();
        let sidebarWidth = this.sidebar.GetWidth ();

        let leftWidth = GetDomElementOuterWidth (this.parameters.leftContainerDiv);
        let rightWidth = GetDomElementOuterWidth (this.parameters.rightContainerDiv);

        let newLeftWidth = leftWidth + leftDiff;
        let newRightWidth = rightWidth + rightDiff;
        let contentNewWidth = windowWidth - newLeftWidth - newRightWidth;

        let isNavigatorVisible = this.navigator.IsPanelsVisible ();
        let isSidebarVisible = this.sidebar.IsPanelsVisible ();

        if (isNavigatorVisible && newLeftWidth < this.limits.minPanelWidth) {
            newLeftWidth = this.limits.minPanelWidth;
        }

        if (isSidebarVisible && newRightWidth < this.limits.minPanelWidth) {
            newRightWidth = this.limits.minPanelWidth;
        }

        if (contentNewWidth < this.limits.minCanvasWidth) {
            if (leftDiff > 0) {
                newLeftWidth = windowWidth - newRightWidth - this.limits.minCanvasWidth;
            } else if (rightDiff > 0) {
                newRightWidth = windowWidth - newLeftWidth - this.limits.minCanvasWidth;
            }
        }

        if (isNavigatorVisible) {
            let newNavigatorWidth = navigatorWidth + (newLeftWidth - leftWidth);
            this.navigator.SetWidth (newNavigatorWidth);
        }
        if (isSidebarVisible) {
            let newSidebarWidth = sidebarWidth + (newRightWidth - rightWidth);
            this.sidebar.SetWidth (newSidebarWidth);
        }

        this.Resize ();
    }

    Resize ()
    {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let headerHeight = this.parameters.headerDiv.offsetHeight;

        let leftWidth = 0;
        let rightWidth = 0;
        let safetyMargin = 0;
        if (!IsSmallWidth ()) {
            leftWidth = GetDomElementOuterWidth (this.parameters.leftContainerDiv);
            rightWidth = GetDomElementOuterWidth (this.parameters.rightContainerDiv);
            safetyMargin = 1;
        }

        let contentWidth = windowWidth - leftWidth - rightWidth;
        let contentHeight = windowHeight - headerHeight;

        if (contentWidth < this.limits.minCanvasWidth) {
            let neededIncrease = this.limits.minCanvasWidth - contentWidth;

            let isNavigatorVisible = this.navigator.IsPanelsVisible ();
            let isSidebarVisible = this.sidebar.IsPanelsVisible ();

            if (neededIncrease > 0 && isNavigatorVisible) {
                let navigatorDecrease = Math.min (neededIncrease, leftWidth - this.limits.minPanelWidth);
                this.navigator.SetWidth (this.navigator.GetWidth () - navigatorDecrease);
                neededIncrease = neededIncrease - navigatorDecrease;
            }

            if (neededIncrease > 0 && isSidebarVisible) {
                let sidebarDecrease = Math.min (neededIncrease, rightWidth - this.limits.minPanelWidth);
                this.sidebar.SetWidth (this.sidebar.GetWidth () - sidebarDecrease);
            }

            leftWidth = GetDomElementOuterWidth (this.parameters.leftContainerDiv);
            rightWidth = GetDomElementOuterWidth (this.parameters.rightContainerDiv);
            contentWidth = windowWidth - leftWidth - rightWidth;
        }

        this.navigator.Resize (contentHeight);
        SetDomElementOuterHeight (this.parameters.navigatorSplitterDiv, contentHeight);

        this.sidebar.Resize (contentHeight);
        SetDomElementOuterHeight (this.parameters.sidebarSplitterDiv, contentHeight);

        SetDomElementOuterHeight (this.parameters.introDiv, contentHeight);
        this.viewer.Resize (contentWidth - safetyMargin, contentHeight);

        this.measureTool.Resize ();
    }
}

class ComponentDragController
{
    constructor (viewer)
    {
        this.viewer = viewer;
        this.isActive = false;
        this.drag = null;
    }

    IsActive ()
    {
        return this.isActive;
    }

    SetActive (isActive)
    {
        this.isActive = isActive;
        if (!this.isActive) {
            this.drag = null;
        }
    }

    Reset ()
    {
        this.drag = null;
        this.viewer.ResetComponentTranslations ();
    }

    OnMouseDown (mouseCoordinates, button)
    {
        if (!this.isActive || button !== 1) {
            return false;
        }

        let intersection = this.viewer.GetMeshIntersectionUnderMouse (IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return false;
        }

        let meshInstanceId = intersection.object.userData.originalMeshInstance.id;
        let dragPlane = new THREE.Plane ().setFromNormalAndCoplanarPoint (
            this.viewer.GetCameraViewDirection (),
            intersection.point
        );

        this.drag = {
            meshInstanceId : meshInstanceId,
            plane : dragPlane,
            startPoint : intersection.point.clone (),
            startTranslation : this.viewer.GetComponentTranslation (meshInstanceId)
        };
        return true;
    }

    OnMouseMove (mouseCoordinates)
    {
        if (this.drag === null) {
            return;
        }

        let ray = this.viewer.GetMouseRay (mouseCoordinates);
        let currentPoint = new THREE.Vector3 ();
        if (ray.intersectPlane (this.drag.plane, currentPoint) === null) {
            return;
        }

        let translation = this.drag.startTranslation.clone ().add (
            currentPoint.sub (this.drag.startPoint)
        );
        this.viewer.SetComponentTranslation (this.drag.meshInstanceId, translation);
    }

    OnMouseUp ()
    {
        this.drag = null;
    }

    OnMouseLeave ()
    {
        this.drag = null;
    }
}

export class Website
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.settings = new Settings (Theme.Light);
        this.cameraSettings = new CameraSettings ();
        this.viewer = new Viewer ();
        this.measureTool = new MeasureTool (this.viewer, this.settings);
        this.componentDragController = new ComponentDragController (this.viewer);
        this.componentDragToolButton = null;
        this.sectionSettings = new SectionSettings ();
        this.sectionToolButton = null;
        this.sectionViewPanel = null;
        this.hashHandler = new HashHandler ();
        this.toolbar = new Toolbar (this.parameters.toolbarDiv);
        this.navigator = new Navigator (this.parameters.navigatorDiv);
        this.sidebar = new Sidebar (this.parameters.sidebarDiv, this.settings);
        this.modelLoaderUI = new ThreeModelLoaderUI ();
        this.themeHandler = new ThemeHandler ();
        this.highlightColor = new RGBColor (142, 201, 240);
        this.uiState = WebsiteUIState.Undefined;
        this.layouter = new WebsiteLayouter (this.parameters, this.navigator, this.sidebar, this.viewer, this.measureTool);
        this.model = null;
    }

    Load ()
    {
        this.settings.LoadFromCookies ();
        this.cameraSettings.LoadFromCookies ();

        this.SwitchTheme (this.settings.themeId, false);
        HandleEvent ('theme_on_load', this.settings.themeId === Theme.Light ? 'light' : 'dark');

        EnumeratePlugins (PluginType.Header, (plugin) => {
            plugin.registerButtons ({
                createHeaderButton : (icon, title, link) => {
                    this.CreateHeaderButton (icon, title, link);
                }
            });
        });

        this.InitViewer ();
        this.InitToolbar ();
        this.InitDragAndDrop ();
        this.InitSidebar ();
        this.InitNavigator ();
        this.InitCookieConsent ();
        this.InitModelLibrary ();

        this.viewer.SetMouseClickHandler (this.OnModelClicked.bind (this));
        this.viewer.SetMouseMoveHandler (this.OnModelMouseMoved.bind (this));
        this.viewer.SetMouseDragHandler ({
            onMouseDown : this.OnModelDragMouseDown.bind (this),
            onMouseMove : this.OnModelDragMouseMove.bind (this),
            onMouseUp : this.OnModelDragMouseUp.bind (this),
            onMouseLeave : this.OnModelDragMouseLeave.bind (this)
        });
        this.viewer.SetContextMenuHandler (this.OnModelContextMenu.bind (this));

        this.layouter.Init ();
        this.SetUIState (WebsiteUIState.Intro);

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        if (!this.LoadModelFromQueryParameters ()) {
            this.OnHashChange ();
        }

        window.addEventListener ('resize', () => {
			this.layouter.Resize ();
		});
    }

    HasLoadedModel ()
    {
        return this.model !== null;
    }

    SetUIState (uiState)
    {
        function ShowOnlyOnModelElements (show)
        {
            let root = document.querySelector (':root');
            root.style.setProperty ('--ov_only_on_model_display', show ? 'inherit' : 'none');
        }

        if (this.uiState === uiState) {
            return;
        }

        this.uiState = uiState;
        if (this.uiState === WebsiteUIState.Intro) {
            ShowDomElement (this.parameters.introDiv, true);
            ShowDomElement (this.parameters.headerDiv, true);
            ShowDomElement (this.parameters.mainDiv, false);
            ShowOnlyOnModelElements (false);
        } else if (this.uiState === WebsiteUIState.Model) {
            ShowDomElement (this.parameters.introDiv, false);
            ShowDomElement (this.parameters.headerDiv, true);
            ShowDomElement (this.parameters.mainDiv, true);
            ShowOnlyOnModelElements (true);
            this.UpdatePanelsVisibility ();
        } else if (this.uiState === WebsiteUIState.Loading) {
            ShowDomElement (this.parameters.introDiv, false);
            ShowDomElement (this.parameters.headerDiv, true);
            ShowDomElement (this.parameters.mainDiv, false);
            ShowOnlyOnModelElements (false);
        }

        this.layouter.Resize ();
    }

    ClearModel ()
    {
        CloseAllDialogs ();

        this.model = null;
        this.viewer.Clear ();

        this.parameters.fileNameDiv.innerHTML = '';

        this.navigator.Clear ();
        this.sidebar.Clear ();

        this.measureTool.SetActive (false);
        this.SetComponentDragMode (false);
        this.viewer.ResetComponentTranslations ();
        this.sectionSettings = new SectionSettings ();
        this.viewer.SetSectionSettings (this.sectionSettings);
        if (this.sectionToolButton !== null) {
            this.sectionToolButton.SetSelected (false);
        }
    }

    OnModelLoaded (importResult, threeObject)
    {
        this.model = importResult.model;
        this.parameters.fileNameDiv.innerHTML = importResult.mainFile;
        this.viewer.SetMainObject (threeObject);
        this.viewer.SetUpVector (Direction.Y, false);
        this.ResetSectionSettingsForModel ();
        this.navigator.FillTree (importResult);
        this.sidebar.UpdateControlsVisibility ();
        this.FitModelToWindow (true);
    }

    OnModelClicked (button, mouseCoordinates)
    {
        if (button !== 1) {
            return;
        }

        if (this.measureTool.IsActive ()) {
            this.measureTool.Click (mouseCoordinates);
            return;
        }

        let meshUserData = this.viewer.GetMeshUserDataUnderMouse (IntersectionMode.MeshAndLine, mouseCoordinates);
        if (meshUserData === null) {
            this.navigator.SetSelection (null);
        } else {
            this.navigator.SetSelection (new Selection (SelectionType.Mesh, meshUserData.originalMeshInstance.id));
        }
    }

    OnModelMouseMoved (mouseCoordinates)
    {
        if (this.measureTool.IsActive ()) {
            this.measureTool.MouseMove (mouseCoordinates);
        }
    }

    OnModelDragMouseDown (mouseCoordinates, button)
    {
        return this.componentDragController.OnMouseDown (mouseCoordinates, button);
    }

    OnModelDragMouseMove (mouseCoordinates)
    {
        this.componentDragController.OnMouseMove (mouseCoordinates);
    }

    OnModelDragMouseUp ()
    {
        this.componentDragController.OnMouseUp ();
    }

    OnModelDragMouseLeave ()
    {
        this.componentDragController.OnMouseLeave ();
    }

    OnModelContextMenu (globalMouseCoordinates, mouseCoordinates)
    {
        let meshUserData = this.viewer.GetMeshUserDataUnderMouse (IntersectionMode.MeshAndLine, mouseCoordinates);
        let items = [];
        if (meshUserData === null) {
            items.push ({
                name : Loc ('Fit model to window'),
                icon : 'fit',
                onClick : () => {
                    this.FitModelToWindow (false);
                }
            });
            if (this.navigator.HasHiddenMesh ()) {
                items.push ({
                    name : Loc ('Show all meshes'),
                    icon : 'visible',
                    onClick : () => {
                        this.navigator.ShowAllMeshes (true);
                    }
                });
            }
        } else {
            items.push ({
                name : Loc ('Hide mesh'),
                icon : 'hidden',
                onClick : () => {
                    this.navigator.ToggleMeshVisibility (meshUserData.originalMeshInstance.id);
                }
            });
            items.push ({
                name : Loc ('Fit mesh to window'),
                icon : 'fit',
                onClick : () => {
                    this.navigator.FitMeshToWindow (meshUserData.originalMeshInstance.id);
                }
            });
            if (this.navigator.MeshItemCount () > 1) {
                let isMeshIsolated = this.navigator.IsMeshIsolated (meshUserData.originalMeshInstance.id);
                items.push ({
                    name : isMeshIsolated ? Loc ('Remove isolation') : Loc ('Isolate mesh'),
                    icon : isMeshIsolated ? 'deisolate' : 'isolate',
                    onClick : () => {
                        if (isMeshIsolated) {
                            this.navigator.ShowAllMeshes (true);
                        } else {
                            this.navigator.IsolateMesh (meshUserData.originalMeshInstance.id);
                        }
                    }
                });
            }
        }
        ShowListPopup (items, {
            calculatePosition : (contentDiv) => {
                return CalculatePopupPositionToScreen (globalMouseCoordinates, contentDiv);
            },
            onClick : (index) => {
                let clickedItem = items[index];
                clickedItem.onClick ();
            }
        });
    }

    OnHashChange ()
    {
        if (this.hashHandler.HasHash ()) {
            let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            TransformFileHostUrls (urls);
            let importSettings = new ImportSettings ();
            importSettings.defaultLineColor = this.settings.defaultLineColor;
            importSettings.defaultColor = this.settings.defaultColor;
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                importSettings.defaultColor = defaultColor;
            }
            HandleEvent ('model_load_started', 'hash');
            this.LoadModelFromUrlList (urls, importSettings);
        } else {
            this.ClearModel ();
            this.SetUIState (WebsiteUIState.Intro);
        }
    }

    LoadModelFromQueryParameters ()
    {
        let queryParams = new URLSearchParams (window.location.search);
        if (!queryParams.has ('model')) {
            return false;
        }

        let modelParam = queryParams.get ('model');
        if (modelParam === null || modelParam.length === 0) {
            return false;
        }

        if (modelParam.startsWith ('http://') || modelParam.startsWith ('https://')) {
            let urls = [this.GetModelUrlFromQueryParameter (modelParam)];
            let importSettings = new ImportSettings ();
            importSettings.defaultLineColor = this.settings.defaultLineColor;
            importSettings.defaultColor = this.settings.defaultColor;
            HandleEvent ('model_load_started', 'query');
            this.LoadModelFromUrlList (urls, importSettings);
        } else {
            this.LoadModelFromShortName (modelParam);
        }
        return true;
    }

    GetBucketBaseUrl ()
    {
        return (typeof BUCKET_BASE_URL !== 'undefined') ? BUCKET_BASE_URL : '';
    }

    LoadModelFromShortName (shortName)
    {
        const bucketBaseUrl = this.GetBucketBaseUrl ();
        if (!bucketBaseUrl) {
            return;
        }
        fetch (bucketBaseUrl + '/index.json').then ((response) => {
            if (!response.ok) {
                return null;
            }
            return response.json ();
        }).then ((index) => {
            if (!index || !index.models) {
                return;
            }
            let entry = index.models.find ((m) => m.name === shortName);
            if (!entry) {
                return;
            }
            this.LoadModelFromBucketEntry (bucketBaseUrl, entry, 'query');
        }).catch (() => {});
    }

    LoadModelFromBucketEntry (bucketBaseUrl, entry, source)
    {
        if (!entry || !entry.file) {
            return;
        }
        let urls = [bucketBaseUrl + '/' + entry.file];
        let importSettings = new ImportSettings ();
        importSettings.defaultLineColor = this.settings.defaultLineColor;
        importSettings.defaultColor = this.settings.defaultColor;
        HandleEvent ('model_load_started', source || 'library');
        this.LoadModelFromUrlList (urls, importSettings);
    }

    InitModelLibrary ()
    {
        const bucketBaseUrl = this.GetBucketBaseUrl ();
        if (!bucketBaseUrl) {
            this.HideModelLibrary ('BUCKET_BASE_URL is not defined (build without R2_BUCKET_BASE_URL).');
            return;
        }
        let indexUrl = bucketBaseUrl + '/index.json';
        fetch (indexUrl).then ((response) => {
            if (!response.ok) {
                return Promise.reject (new Error ('index.json responded with HTTP ' + response.status));
            }
            return response.json ();
        }).then ((index) => {
            if (!index || !index.models) {
                this.HideModelLibrary ('index.json has no "models" array.');
                return;
            }
            this.FillModelLibrary (bucketBaseUrl, index.models);
        }).catch ((error) => {
            this.HideModelLibrary ('could not fetch ' + indexUrl + ' (likely CORS or network): ' + error.message);
        });
    }

    HideModelLibrary (reason)
    {
        if (reason) {
            console.warn ('[ModelLibrary] panel hidden — ' + reason);
        }
        ShowDomElement (this.parameters.modelLibraryDiv, false);
        this.parameters.introDiv.classList.remove ('has_model_library');
    }

    FillModelLibrary (bucketBaseUrl, models)
    {
        const supportedExtensions = new Set ([
            '3dm', '3ds', '3mf', 'amf', 'bim', 'brep', 'dae', 'fbx', 'fcstd',
            'gltf', 'glb', 'ifc', 'igs', 'iges', 'stp', 'step', 'stl', 'obj',
            'off', 'ply', 'wrl'
        ]);
        let loadableModels = models.filter ((model) => {
            if (!model || !model.file) {
                return false;
            }
            return supportedExtensions.has (GetFileExtension (model.file));
        });

        let listDiv = this.parameters.modelLibraryListDiv;
        ClearDomElement (listDiv);
        if (loadableModels.length === 0) {
            this.HideModelLibrary ('index.json has ' + models.length + ' entries but none have a supported 3D extension.');
            return;
        }
        console.log ('[ModelLibrary] showing ' + loadableModels.length + ' of ' + models.length + ' entries.');

        for (let model of loadableModels) {
            let displayName = model.displayName || model.name || model.file;
            let itemDiv = AddDiv (listDiv, 'model_library_item', displayName);
            itemDiv.setAttribute ('title', displayName);
            itemDiv.addEventListener ('click', () => {
                this.LoadModelFromBucketEntry (bucketBaseUrl, model, 'library');
            });
        }
        ShowDomElement (this.parameters.modelLibraryDiv, true);
        this.parameters.introDiv.classList.add ('has_model_library');
    }

    GetModelUrlFromQueryParameter (modelUrl)
    {
        let isWindowsAbsolutePath = /^[a-zA-Z]:[\\/]/.test (modelUrl);
        let isUncPath = modelUrl.startsWith ('\\\\');
        if (isWindowsAbsolutePath || isUncPath) {
            return '../local-model?path=' + encodeURIComponent (modelUrl);
        }
        return modelUrl;
    }

    OpenFileBrowserDialog ()
    {
        this.parameters.fileInput.click ();
    }

    FitModelToWindow (onLoad)
    {
        let animation = !onLoad;
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshInstance.id);
        });
        if (onLoad) {
            this.viewer.AdjustClippingPlanesToSphere (boundingSphere);
        }
        this.viewer.FitSphereToWindow (boundingSphere, animation);
    }

    FitMeshToWindow (meshInstanceId)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return meshUserData.originalMeshInstance.id.IsEqual (meshInstanceId);
        });
        this.viewer.FitSphereToWindow (boundingSphere, true);
    }

    FitMeshesToWindow (meshInstanceIdSet)
    {
        let meshInstanceIdKeys = new Set ();
        for (let meshInstanceId of meshInstanceIdSet) {
            meshInstanceIdKeys.add (meshInstanceId.GetKey ());
        }
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return meshInstanceIdKeys.has (meshUserData.originalMeshInstance.id.GetKey ());
        });
        this.viewer.FitSphereToWindow (boundingSphere, true);
    }

    UpdateMeshesVisibility ()
    {
        this.viewer.SetMeshesVisibility ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshInstance.id);
        });
    }

    UpdateMeshesSelection ()
    {
        let selectedMeshId = this.navigator.GetSelectedMeshId ();
        this.viewer.SetMeshesHighlight (this.highlightColor, (meshUserData) => {
            if (selectedMeshId !== null && meshUserData.originalMeshInstance.id.IsEqual (selectedMeshId)) {
                return true;
            }
            return false;
        });
    }

    LoadModelFromUrlList (urls, settings)
    {
        let inputFiles = InputFilesFromUrls (urls);
        this.LoadModelFromInputFiles (inputFiles, settings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    LoadModelFromFileList (files)
    {
        let importSettings = new ImportSettings ();
        importSettings.defaultLineColor = this.settings.defaultLineColor;
        importSettings.defaultColor = this.settings.defaultColor;
        let inputFiles = InputFilesFromFileObjects (files);
        this.LoadModelFromInputFiles (inputFiles, importSettings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    LoadModelFromInputFiles (files, settings)
    {
        this.modelLoaderUI.LoadModel (files, settings, {
            onStart : () =>
            {
                this.SetUIState (WebsiteUIState.Loading);
                this.ClearModel ();
            },
            onFinish : (importResult, threeObject) =>
            {
                this.SetUIState (WebsiteUIState.Model);
                this.OnModelLoaded (importResult, threeObject);
                let importedExtension = GetFileExtension (importResult.mainFile);
                HandleEvent ('model_loaded', importedExtension);
            },
            onRender : () =>
            {
                this.viewer.Render ();
            },
            onError : (importError) =>
            {
                this.SetUIState (WebsiteUIState.Intro);
                let extensionStr = null;
                if (importError.mainFile !== null) {
                    extensionStr = GetFileExtension (importError.mainFile);
                } else {
                    let extensions = [];
                    let importer = this.modelLoaderUI.GetImporter ();
                    let fileList = importer.GetFileList ().GetFiles ();
                    for (let i = 0; i < fileList.length; i++) {
                        let extension = fileList[i].extension;
                        extensions.push (extension);
                    }
                    extensionStr = extensions.join (',');
                }
                if (importError.code === ImportErrorCode.NoImportableFile) {
                    HandleEvent ('no_importable_file', extensionStr);
                } else if (importError.code === ImportErrorCode.FailedToLoadFile) {
                    HandleEvent ('failed_to_load_file', extensionStr);
                } else if (importError.code === ImportErrorCode.ImportFailed) {
                    HandleEvent ('import_failed', extensionStr, {
                        error_message : importError.message
                    });
                }
            }
        });
    }

    ClearHashIfNotOnlyUrlList ()
    {
        let importer = this.modelLoaderUI.GetImporter ();
        let isOnlyUrl = importer.GetFileList ().IsOnlyUrlSource ();
        if (!isOnlyUrl && this.hashHandler.HasHash ()) {
            this.hashHandler.SkipNextEventHandler ();
            this.hashHandler.ClearHash ();
        }
    }

    UpdateEdgeDisplay ()
    {
        this.settings.SaveToCookies ();
        this.viewer.SetEdgeSettings (this.settings.edgeSettings);
    }

    ResetSectionSettingsForModel ()
    {
        let boundingBox = this.viewer.GetBoundingBox ((meshUserData) => {
            return true;
        });
        this.sectionSettings = CreateDefaultSectionSettings (boundingBox);
        this.sectionSettings.enabled = false;
        this.viewer.SetSectionSettings (this.sectionSettings);
        if (this.sectionToolButton !== null) {
            this.sectionToolButton.SetSelected (false);
        }
    }

    GetVisibleModelBoundingBox ()
    {
        if (!this.HasLoadedModel ()) {
            return null;
        }
        return this.viewer.GetBoundingBox ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshInstance.id);
        });
    }

    HasActiveSectionView ()
    {
        return this.sectionSettings.HasActivePlane ();
    }

    ShowSectionViewPanel ()
    {
        let previousSettings = this.sectionSettings.Clone ();
        let panelDiv = this.sidebar.ShowTemporaryPanel ();
        let previewSettings = this.sectionSettings.Clone ();
        previewSettings.enabled = true;
        previewSettings.usePartColorCaps = false;
        previewSettings.showPlaneOverlays = true;
        let hasEnabledPlane = false;
        for (let plane of previewSettings.planes) {
            if (plane.enabled) {
                hasEnabledPlane = true;
                break;
            }
        }
        if (!hasEnabledPlane) {
            previewSettings.planes[0].enabled = true;
        }

        this.sectionViewPanel = new SectionViewPanel (panelDiv, previewSettings, this.GetVisibleModelBoundingBox (), {
            onPreview : (settings) => {
                let previewSettings = settings.Clone ();
                previewSettings.usePartColorCaps = false;
                previewSettings.showPlaneOverlays = true;
                this.viewer.SetSectionSettings (previewSettings);
            },
            onApply : (settings) => {
                this.sectionSettings = settings.Clone ();
                this.sectionSettings.usePartColorCaps = true;
                this.sectionSettings.showPlaneOverlays = false;
                this.viewer.SetSectionSettings (this.sectionSettings);
                this.sidebar.CloseTemporaryPanel ();
                this.sectionViewPanel = null;
                this.sectionToolButton.SetSelected (this.HasActiveSectionView ());
            },
            onCancel : () => {
                this.sectionSettings = previousSettings.Clone ();
                this.sectionSettings.showPlaneOverlays = false;
                this.viewer.SetSectionSettings (this.sectionSettings);
                this.sidebar.CloseTemporaryPanel ();
                this.sectionViewPanel = null;
                this.sectionToolButton.SetSelected (this.HasActiveSectionView ());
            }
        });
        requestAnimationFrame (() => {
            this.layouter.Resize ();
            this.viewer.Render ();
        });
    }

    DisableSectionView ()
    {
        this.sidebar.CloseTemporaryPanel ();
        this.sectionViewPanel = null;
        this.sectionSettings.enabled = false;
        this.sectionSettings.showPlaneOverlays = false;
        this.viewer.SetSectionSettings (this.sectionSettings);
        if (this.sectionToolButton !== null) {
            this.sectionToolButton.SetSelected (false);
        }
    }

    CloseSectionViewPanelForTool ()
    {
        if (this.sectionViewPanel === null) {
            return;
        }
        this.sidebar.CloseTemporaryPanel ();
        this.sectionViewPanel = null;
        this.sectionSettings.showPlaneOverlays = false;
        this.viewer.SetSectionSettings (this.sectionSettings);
        if (this.sectionToolButton !== null) {
            this.sectionToolButton.SetSelected (this.HasActiveSectionView ());
        }
    }

    SetComponentDragMode (isActive)
    {
        if (isActive) {
            this.measureTool.SetActive (false);
            this.CloseSectionViewPanelForTool ();
            this.navigator.SetSelection (null);
        }
        this.componentDragController.SetActive (isActive);
        if (this.componentDragToolButton !== null) {
            this.componentDragToolButton.SetSelected (isActive);
        }
    }

    ResetComponentPositions ()
    {
        this.componentDragController.Reset ();
    }

    UpdateEnvironmentMap ()
    {
        let envMapPath = 'assets/envmaps/' + this.settings.environmentMapName + '/';
        let envMapTextures = [
            envMapPath + 'posx.jpg',
            envMapPath + 'negx.jpg',
            envMapPath + 'posy.jpg',
            envMapPath + 'negy.jpg',
            envMapPath + 'posz.jpg',
            envMapPath + 'negz.jpg'
        ];
        let environmentSettings = new EnvironmentSettings (envMapTextures, this.settings.backgroundIsEnvMap);
        this.viewer.SetEnvironmentMapSettings (environmentSettings);
    }

    SwitchTheme (newThemeId, resetColors)
    {
        this.settings.themeId = newThemeId;
        this.themeHandler.SwitchTheme (this.settings.themeId);
        if (resetColors) {
            let defaultSettings = new Settings (this.settings.themeId);
            this.settings.backgroundColor = defaultSettings.backgroundColor;
            this.settings.defaultLineColor = defaultSettings.defaultLineColor;
            this.settings.defaultColor = defaultSettings.defaultColor;
            this.sidebar.UpdateControlsStatus ();

            this.viewer.SetBackgroundColor (this.settings.backgroundColor);
            let modelLoader = this.modelLoaderUI.GetModelLoader ();
            if (modelLoader.GetDefaultMaterials () !== null) {
                ReplaceDefaultMaterialsColor (this.model, this.settings.defaultColor, this.settings.defaultLineColor);
                modelLoader.ReplaceDefaultMaterialsColor (this.settings.defaultColor, this.settings.defaultLineColor);
            }
        }

        this.settings.SaveToCookies ();
    }

    InitViewer ()
    {
        let canvas = AddDomElement (this.parameters.viewerDiv, 'canvas');
        this.viewer.Init (canvas);
        this.viewer.SetEdgeSettings (this.settings.edgeSettings);
        this.viewer.SetBackgroundColor (this.settings.backgroundColor);
        this.viewer.SetNavigationMode (this.cameraSettings.navigationMode);
        this.viewer.SetProjectionMode (this.cameraSettings.projectionMode);
        this.UpdateEnvironmentMap ();
    }

    InitToolbar ()
    {
        function AddButton (toolbar, imageName, imageTitle, classNames, onClick)
        {
            let button = toolbar.AddImageButton (imageName, imageTitle, () => {
                onClick ();
            });
            for (let className of classNames) {
                button.AddClass (className);
            }
            return button;
        }

        function AddPushButton (toolbar, imageName, imageTitle, classNames, onClick)
        {
            let button = toolbar.AddImagePushButton (imageName, imageTitle, false, (isSelected) => {
                onClick (isSelected);
            });
            for (let className of classNames) {
                button.AddClass (className);
            }
            return button;
        }

        function AddRadioButton (toolbar, imageNames, imageTitles, selectedIndex, classNames, onClick)
        {
            let imageData = [];
            for (let i = 0; i < imageNames.length; i++) {
                let imageName = imageNames[i];
                let imageTitle = imageTitles[i];
                imageData.push ({
                    image : imageName,
                    title : imageTitle
                });
            }
            let buttons = toolbar.AddImageRadioButton (imageData, selectedIndex, (buttonIndex) => {
                onClick (buttonIndex);
            });
            for (let className of classNames) {
                for (let button of buttons) {
                    button.AddClass (className);
                }
            }
        }

        function AddSeparator (toolbar, classNames)
        {
            let separator = toolbar.AddSeparator ();
            if (classNames !== null) {
                for (let className of classNames) {
                    separator.classList.add (className);
                }
            }
        }

        let importer = this.modelLoaderUI.GetImporter ();
        let navigationModeIndex = (this.cameraSettings.navigationMode === NavigationMode.FixedUpVector ? 0 : 1);
        let projectionModeIndex = (this.cameraSettings.projectionMode === ProjectionMode.Perspective ? 0 : 1);

        AddButton (this.toolbar, 'open', Loc ('Open from your device'), [], () => {
            this.OpenFileBrowserDialog ();
        });
        AddButton (this.toolbar, 'open_url', Loc ('Open from url'), [], () => {
            ShowOpenUrlDialog ((urls) => {
                if (urls.length > 0) {
                    this.hashHandler.SetModelFilesToHash (urls);
                }
            });
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddButton (this.toolbar, 'fit', Loc ('Fit model to window'), ['only_on_model'], () => {
            this.FitModelToWindow (false);
        });
        AddButton (this.toolbar, 'up_y', Loc ('Set Y axis as up vector'), ['only_on_model'], () => {
            this.viewer.SetUpVector (Direction.Y, true);
        });
        AddButton (this.toolbar, 'up_z', Loc ('Set Z axis as up vector'), ['only_on_model'], () => {
            this.viewer.SetUpVector (Direction.Z, true);
        });
        AddButton (this.toolbar, 'flip', Loc ('Flip up vector'), ['only_on_model'], () => {
            this.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        AddRadioButton (this.toolbar, ['fix_up_on', 'fix_up_off'], [Loc ('Fixed up vector'), Loc ('Free orbit')], navigationModeIndex, ['only_full_width', 'only_on_model'], (buttonIndex) => {
            if (buttonIndex === 0) {
                this.cameraSettings.navigationMode = NavigationMode.FixedUpVector;
            } else if (buttonIndex === 1) {
                this.cameraSettings.navigationMode = NavigationMode.FreeOrbit;
            }
            this.cameraSettings.SaveToCookies ();
            this.viewer.SetNavigationMode (this.cameraSettings.navigationMode);
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        AddRadioButton (this.toolbar, ['camera_perspective', 'camera_orthographic'], [Loc ('Perspective camera'), Loc ('Orthographic camera')], projectionModeIndex, ['only_full_width', 'only_on_model'], (buttonIndex) => {
            if (buttonIndex === 0) {
                this.cameraSettings.projectionMode = ProjectionMode.Perspective;
            } else if (buttonIndex === 1) {
                this.cameraSettings.projectionMode = ProjectionMode.Orthographic;
            }
            this.cameraSettings.SaveToCookies ();
            this.viewer.SetProjectionMode (this.cameraSettings.projectionMode);
            this.sidebar.UpdateControlsVisibility ();
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        let measureToolButton = AddPushButton (this.toolbar, 'measure', Loc ('Measure'), ['only_full_width', 'only_on_model'], (isSelected) => {
            HandleEvent ('measure_tool_activated', isSelected ? 'on' : 'off');
            if (isSelected) {
                this.SetComponentDragMode (false);
            }
            this.navigator.SetSelection (null);
            this.measureTool.SetActive (isSelected);
        });
        this.measureTool.SetButton (measureToolButton);
        AddSeparator (this.toolbar, ['only_on_model']);
        this.componentDragToolButton = AddPushButton (this.toolbar, 'drag_components', Loc ('Drag Components'), ['only_on_model'], (isSelected) => {
            this.SetComponentDragMode (isSelected);
        });
        AddButton (this.toolbar, 'reset_components', Loc ('Reset Component Positions'), ['only_on_model'], () => {
            this.ResetComponentPositions ();
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        this.sectionToolButton = AddPushButton (this.toolbar, 'sectionView', Loc ('Section View'), ['only_on_model'], (isSelected) => {
            if (isSelected) {
                this.SetComponentDragMode (false);
                this.navigator.SetSelection (null);
                this.measureTool.SetActive (false);
                this.ShowSectionViewPanel ();
            } else {
                this.DisableSectionView ();
            }
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddButton (this.toolbar, 'download', Loc ('Download'), ['only_full_width', 'only_on_model'], () => {
            HandleEvent ('model_downloaded', '');
            let importer = this.modelLoaderUI.GetImporter ();
            DownloadModel (importer);
        });
        AddButton (this.toolbar, 'export', Loc ('Export'), ['only_full_width', 'only_on_model'], () => {
            ShowExportDialog (this.model, this.viewer, {
                isMeshVisible : (meshInstanceId) => {
                    return this.navigator.IsMeshVisible (meshInstanceId);
                }
            });
        });
        AddButton (this.toolbar, 'share', Loc ('Share'), ['only_full_width', 'only_on_model'], () => {
            ShowSharingDialog (importer.GetFileList (), this.settings, this.viewer);
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        AddButton (this.toolbar, 'snapshot', Loc ('Create snapshot'), ['only_full_width', 'only_on_model'], () => {
            ShowSnapshotDialog (this.viewer);
        });

        EnumeratePlugins (PluginType.Toolbar, (plugin) => {
            plugin.registerButtons ({
                createSeparator : (classNames) => {
                    AddSeparator (this.toolbar, classNames);
                },
                createButton : (icon, title, classNames, onClick) => {
                    AddButton (this.toolbar, icon, title, classNames, onClick);
                },
                getModel : () => {
                    return this.model;
                }
            });
        });

        let selectedTheme = (this.settings.themeId === Theme.Light ? 1 : 0);
        AddRadioButton (this.toolbar, ['dark_mode', 'light_mode'], [Loc ('Dark mode'), Loc ('Light mode')], selectedTheme, ['align_right'], (buttonIndex) => {
            if (buttonIndex === 0) {
                this.settings.themeId = Theme.Dark;
            } else if (buttonIndex === 1) {
                this.settings.themeId = Theme.Light;
            }
            HandleEvent ('theme_changed', this.settings.themeId === Theme.Light ? 'light' : 'dark');
            this.SwitchTheme (this.settings.themeId, true);
        });

        this.parameters.fileInput.addEventListener ('change', (ev) => {
            if (ev.target.files.length > 0) {
                HandleEvent ('model_load_started', 'open_file');
                this.LoadModelFromFileList (ev.target.files);
            }
        });
    }

    InitDragAndDrop ()
    {
        window.addEventListener ('dragstart', (ev) => {
            ev.preventDefault ();
        }, false);

        window.addEventListener ('dragover', (ev) => {
            ev.stopPropagation ();
            ev.preventDefault ();
            ev.dataTransfer.dropEffect = 'copy';
        }, false);

        window.addEventListener ('drop', (ev) => {
            ev.stopPropagation ();
            ev.preventDefault ();
            GetFilesFromDataTransfer (ev.dataTransfer, (files) => {
                if (files.length > 0) {
                    HandleEvent ('model_load_started', 'drop');
                    this.LoadModelFromFileList (files);
                }
            });
        }, false);
    }

    InitSidebar ()
    {
        this.sidebar.Init ({
            getShadingType : () => {
                return this.viewer.GetShadingType ();
            },
            getProjectionMode : () => {
                return this.viewer.GetProjectionMode ();
            },
            getDefaultMaterials : () => {
                return GetDefaultMaterials (this.model);
            },
            onEnvironmentMapChanged : () => {
                this.settings.SaveToCookies ();
                this.UpdateEnvironmentMap ();
                if (this.measureTool.IsActive ()) {
                    this.measureTool.UpdatePanel ();
                }
            },
            onBackgroundColorChanged : () => {
                this.settings.SaveToCookies ();
                this.viewer.SetBackgroundColor (this.settings.backgroundColor);
                if (this.measureTool.IsActive ()) {
                    this.measureTool.UpdatePanel ();
                }
            },
            onDefaultColorChanged : () => {
                this.settings.SaveToCookies ();
                let modelLoader = this.modelLoaderUI.GetModelLoader ();
                if (modelLoader.GetDefaultMaterials () !== null) {
                    ReplaceDefaultMaterialsColor (this.model, this.settings.defaultColor, this.settings.defaultLineColor);
                    modelLoader.ReplaceDefaultMaterialsColor (this.settings.defaultColor, this.settings.defaultLineColor);
                }
                this.viewer.Render ();
            },
            onEdgeDisplayChanged : () => {
                HandleEvent ('edge_display_changed', this.settings.showEdges ? 'on' : 'off');
                this.UpdateEdgeDisplay ();
            },
            onResizeRequested : () => {
                this.layouter.Resize ();
            },
            onShowHidePanels : (show) => {
                ShowDomElement (this.parameters.sidebarSplitterDiv, show);
                CookieSetBoolVal ('ov_show_sidebar', show);
            }
        });
    }

    InitNavigator ()
    {
        function GetMeshUserDataArray (viewer, meshInstanceId)
        {
            let userDataArr = [];
            viewer.EnumerateMeshesAndLinesUserData ((meshUserData) => {
                if (meshUserData.originalMeshInstance.id.IsEqual (meshInstanceId)) {
                    userDataArr.push (meshUserData);
                }
            });
            return userDataArr;
        }

        function GetMeshesForMaterial (viewer, materialIndex)
        {
            let usedByMeshes = [];
            viewer.EnumerateMeshesAndLinesUserData ((meshUserData) => {
                if (materialIndex === null || meshUserData.originalMaterials.indexOf (materialIndex) !== -1) {
                    usedByMeshes.push (meshUserData.originalMeshInstance);
                }
            });
            return usedByMeshes;
        }

        function GetMaterialReferenceInfo (model, materialIndex)
        {
            const material = model.GetMaterial (materialIndex);
            return {
                index : materialIndex,
                name : material.name,
                color : material.color.Clone ()
            };
        }

        function GetMaterialsForMesh (viewer, model, meshInstanceId)
        {
            let usedMaterials = [];
            if (meshInstanceId === null) {
                for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
                    usedMaterials.push (GetMaterialReferenceInfo (model, materialIndex));
                }
            } else {
                let userDataArr = GetMeshUserDataArray (viewer, meshInstanceId);
                let addedMaterialIndices = new Set ();
                for (let userData of userDataArr) {
                    for (let materialIndex of userData.originalMaterials) {
                        if (addedMaterialIndices.has (materialIndex)) {
                            continue;
                        }
                        usedMaterials.push (GetMaterialReferenceInfo (model, materialIndex));
                        addedMaterialIndices.add (materialIndex);
                    }
                }
            }
            usedMaterials.sort ((a, b) => {
                return a.index - b.index;
            });
            return usedMaterials;
        }

        this.navigator.Init ({
            openFileBrowserDialog : () => {
                this.OpenFileBrowserDialog ();
            },
            fitMeshToWindow : (meshInstanceId) => {
                this.FitMeshToWindow (meshInstanceId);
            },
            fitMeshesToWindow : (meshInstanceIdSet) => {
                this.FitMeshesToWindow (meshInstanceIdSet);
            },
            getMeshesForMaterial : (materialIndex) => {
                return GetMeshesForMaterial (this.viewer, materialIndex);
            },
            getMaterialsForMesh : (meshInstanceId) => {
                return GetMaterialsForMesh (this.viewer, this.model, meshInstanceId);
            },
            onMeshVisibilityChanged : () => {
                this.UpdateMeshesVisibility ();
            },
            onMeshSelectionChanged : () => {
                this.UpdateMeshesSelection ();
            },
            onSelectionCleared : () => {
                this.sidebar.AddObject3DProperties (this.model, this.model);
            },
            onMeshSelected : (meshInstanceId) => {
                let meshInstance = this.model.GetMeshInstance (meshInstanceId);
                this.sidebar.AddObject3DProperties (this.model, meshInstance);
            },
            onMaterialSelected : (materialIndex) => {
                this.sidebar.AddMaterialProperties (this.model.GetMaterial (materialIndex));
            },
            onResizeRequested : () => {
                this.layouter.Resize ();
            },
            onShowHidePanels : (show) => {
                ShowDomElement (this.parameters.navigatorSplitterDiv, show);
                CookieSetBoolVal ('ov_show_navigator', show);
            }
        });
    }

    UpdatePanelsVisibility ()
    {
        let showNavigator = CookieGetBoolVal ('ov_show_navigator', true);
        let showSidebar = CookieGetBoolVal ('ov_show_sidebar', true);
        this.navigator.ShowPanels (showNavigator);
        this.sidebar.ShowPanels (showSidebar);
    }

    CreateHeaderButton (icon, title, link)
    {
        let buttonLink = CreateDomElement ('a');
        buttonLink.setAttribute ('href', link);
        buttonLink.setAttribute ('target', '_blank');
        buttonLink.setAttribute ('rel', 'noopener noreferrer');
        InstallTooltip (buttonLink, title);
        AddSvgIconElement (buttonLink, icon, 'header_button');
        this.parameters.headerButtonsDiv.appendChild (buttonLink);
        return buttonLink;
    }

    InitCookieConsent ()
    {
        let accepted = CookieGetBoolVal ('ov_cookie_consent', false);
        if (accepted) {
            return;
        }

        let text = Loc ('This website uses cookies to offer you better user experience. See the details at the <a target="_blank" href="info/cookies.html">Cookies Policy</a> page.');
        let popupDiv = AddDiv (document.body, 'ov_bottom_floating_panel');
        AddDiv (popupDiv, 'ov_floating_panel_text', text);
        let acceptButton = AddDiv (popupDiv, 'ov_button ov_floating_panel_button', Loc ('Accept'));
        acceptButton.addEventListener ('click', () => {
            CookieSetBoolVal ('ov_cookie_consent', true);
            popupDiv.remove ();
        });
    }
}
