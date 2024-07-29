import { GetFileExtension, TransformFileHostUrls } from '../engine/io/fileutils.js';
import { InputFilesFromFileObjects, InputFilesFromUrls } from '../engine/import/importerfiles.js';
import { ImportErrorCode, ImportSettings } from '../engine/import/importer.js';
import { NavigationMode, ProjectionMode } from '../engine/viewer/camera.js';
import { RGBColor } from '../engine/model/color.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { AddDiv, CreateDiv , AddDomElement, ShowDomElement, SetDomElementOuterHeight, CreateDomElement, GetDomElementOuterWidth, GetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToScreen, ShowListPopup } from './dialogs.js';
import { HandleEvent } from './eventhandler.js';
import { HashHandler } from './hashhandler.js';
import { Navigator, Selection, SelectionType } from './navigator.js';
import { CameraSettings, Settings, Theme } from './settings.js';
import { Sidebar } from './sidebar.js';
import { ThemeHandler } from './themehandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';
import { Toolbar, ToolbarButton } from './toolbar.js';
import { AddSvgIconElement, GetFilesFromDataTransfer, InstallTooltip, IsSmallWidth } from './utils.js';
import { ShowSharingDialog } from './sharingdialog.js';
import { GetDefaultMaterials, ReplaceDefaultMaterialsColor } from '../engine/model/modelutils.js';
import { Direction } from '../engine/geometry/geometry.js';
import { CookieGetBoolVal, CookieSetBoolVal } from './cookiehandler.js';
import { MeasureTool } from './measuretool.js';
import { EraserTool } from './erase.js';
import { ClearAllTool } from './cleartool.js';
import { HighlightTool } from './highlighttool.js';
import { CloseAllDialogs } from './dialog.js';
import { CreateVerticalSplitter } from './splitter.js';
import { EnumeratePlugins, PluginType } from './pluginregistry.js';
import { EnvironmentSettings } from '../engine/viewer/shadingmodel.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { Loc } from '../engine/core/localization.js';
import { startTour } from './tour.js';

const WebsiteUIState =
{
    Undefined : 0,
    Intro : 1,
    Model : 2,
    Loading : 3
};

class WebsiteLayouter
{
    constructor (parameters, navigator, sidebar, viewer, measureTool, highlightTool, eraserTool, clearTool)
    {
        this.parameters = parameters;
        this.navigator = navigator;
        this.sidebar = sidebar;
        this.viewer = viewer;
        this.measureTool = measureTool;
        this.highlightTool = highlightTool;
        this.eraserTool = eraserTool;
        this.clearTool = clearTool;
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

        let leftWidth = this.parameters.leftContainerDiv.style.display === 'none' ? 0 : GetDomElementOuterWidth(this.parameters.leftContainerDiv);
        let rightWidth = this.parameters.rightContainerDiv.style.display === 'none' ? 0 : GetDomElementOuterWidth(this.parameters.rightContainerDiv);
        let safetyMargin = 0;
        if (!IsSmallWidth()) {
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

        let introContentHeight = GetDomElementOuterHeight (this.parameters.introContentDiv);
        let introContentTop = (contentHeight - introContentHeight) / 3.0;
        this.parameters.introContentDiv.style.top = introContentTop.toString () + 'px';

        this.measureTool.Resize ();
        this.highlightTool.Resize();
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
        this.hashHandler = new HashHandler ();
        this.toolbar = new Toolbar (this.parameters.toolbarDiv);
        this.navigator = new Navigator (this.parameters.navigatorDiv);
        this.highlightTool = new HighlightTool(this.viewer, this.settings);
        this.eraserTool = new EraserTool(this.viewer, this.settings);
        this.clearTool = new ClearAllTool(this.viewer, this.settings);
        this.sidebar = new Sidebar (this.parameters.sidebarDiv, this.settings);
        this.modelLoaderUI = new ThreeModelLoaderUI ();
        this.themeHandler = new ThemeHandler ();
        this.highlightColor = new RGBColor (142, 201, 240);
        this.uiState = WebsiteUIState.Undefined;
        this.layouter = new WebsiteLayouter (this.parameters, this.navigator, this.sidebar, this.viewer, this.measureTool, this.highlightTool, this.eraserTool, this.clearTool);
        this.model = null;
    }

    IsMobileScreen() {
        return window.innerWidth <= 768; // You can adjust this threshold as needed
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

        this.viewer.SetMouseClickHandler (this.OnModelClicked.bind (this));
        this.viewer.SetMouseMoveHandler (this.OnModelMouseMove.bind(this));
        this.viewer.SetContextMenuHandler (this.OnModelContextMenu.bind (this));

        this.layouter.Init ();
        this.SetUIState (WebsiteUIState.Intro);

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        this.OnHashChange ();

        window.addEventListener('resize', () => {
            this.layouter.Resize();
            if (this.uiState === WebsiteUIState.Model) {
                if (this.IsMobileScreen()) {
                    this.navigator.ShowPanels(false);
                    this.sidebar.ShowPanels(false);
                } else {
                    this.UpdatePanelsVisibility();
                }
            }
        });
        startTour();
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

            if (this.IsMobileScreen()) {
                // For mobile screens, minimize panels by default
                this.navigator.ShowPanels(false);
                this.sidebar.ShowPanels(false);
                CookieSetBoolVal('ov_show_navigator', false);
                CookieSetBoolVal('ov_show_sidebar', false);
            } else {
                this.UpdatePanelsVisibility();
            }

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

        // this.parameters.fileNameDiv.innerHTML = '';

        this.navigator.Clear ();
        this.sidebar.Clear ();

        this.measureTool.SetActive (false);
        this.highlightTool.SetActive(false);
    }

    OnModelLoaded (importResult, threeObject)
    {
        this.model = importResult.model;
        // this.parameters.fileNameDiv.innerHTML = importResult.mainFile;
        this.viewer.SetMainObject (threeObject);
        this.viewer.SetUpVector (Direction.Y, false);
        this.navigator.FillTree (importResult);
        this.sidebar.UpdateControlsVisibility ();
        this.FitModelToWindow (true);
    }

    OnModelClicked (button, mouseCoordinates) {
        if (button !== 1 && button !== 2) {
            return;
        }

        if (this.measureTool.IsActive()) {
            this.measureTool.Click(mouseCoordinates);
            return;
        }

        if (this.highlightTool.IsActive()) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse(IntersectionMode.MeshAndLine, mouseCoordinates);
            if (meshUserData === null) {
                // No intersection with model, allow navigation
                this.viewer.navigation.EnableCameraMovement(true);
            } else {
                // Intersection with model, use highlight tool
                this.highlightTool.Click(mouseCoordinates);
                this.viewer.navigation.EnableCameraMovement(false);
            }
            return;
        }

        let meshUserData = this.viewer.GetMeshUserDataUnderMouse(IntersectionMode.MeshAndLine, mouseCoordinates);
        if (meshUserData === null) {
            this.navigator.SetSelection(null);
        } else {
            this.navigator.SetSelection(new Selection(SelectionType.Mesh, meshUserData.originalMeshInstance.id));
        }
    }

    OnModelContextMenu (globalMouseCoordinates, mouseCoordinates)
    {
        if (this.highlightTool.IsActive()) {
            this.highlightTool.Click(mouseCoordinates, 2); // Handle right-click for removing highlight
            return;
        }

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

    LoadModelFromUrlList (urls) {
        let importSettings = new ImportSettings ();
        importSettings.defaultLineColor = this.settings.defaultLineColor;
        importSettings.defaultColor = this.settings.defaultColor;
        let inputFiles = InputFilesFromUrls (urls);
        this.LoadModelFromInputFiles (inputFiles, importSettings);
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

        this.viewer.SetMouseDownHandler(this.OnModelMouseDown.bind(this));
        this.viewer.SetMouseMoveHandler(this.OnModelMouseMove.bind(this));
        this.viewer.SetMouseUpHandler(this.OnModelMouseUp.bind(this));

        this.viewer.GetCanvas().addEventListener('mouseenter', this.OnCanvasMouseLeave.bind(this));
    }

    OnModelMouseDown(mouseCoordinates) {
        if (this.highlightTool.IsActive() || this.eraserTool.IsActive()) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse(IntersectionMode.MeshAndLine, mouseCoordinates);
            if (meshUserData === null) {
                // No intersection with model, allow navigation
                this.viewer.navigation.EnableCameraMovement(true);
                this.isNavigating = true;
            } else {
                // Intersection with model, use highlight or eraser tool
                this.viewer.navigation.EnableCameraMovement(false);
            }
        }
    }

    OnModelMouseMove(mouseCoordinates) {
        if ((this.highlightTool.IsActive() || this.eraserTool.IsActive()) && !this.isNavigating) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse(IntersectionMode.MeshAndLine, mouseCoordinates);
            if (meshUserData !== null) {
                if (this.highlightTool.IsActive()) {
                    this.highlightTool.MouseMove(mouseCoordinates);
                } else if (this.eraserTool.IsActive()) {
                    this.eraserTool.MouseMove(mouseCoordinates);
                }
            }
        }
    }

    OnModelMouseUp(mouseCoordinates) {
        if (this.highlightTool.IsActive() || this.eraserTool.IsActive()) {
            if (!this.isNavigating) {
                if (this.highlightTool.IsActive()) {
                    this.highlightTool.Click(mouseCoordinates);
                } else if (this.eraserTool.IsActive()) {
                    this.eraserTool.Click(mouseCoordinates);
                }
            }
            this.isNavigating = false;
        }
    }
    
    OnCanvasMouseLeave() {
        if (this.highlightTool.IsActive()) {
            this.highlightTool.HideBrushSizeSlider();
        }
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

        function AddToggle(toolbar, toggleId, options, loadModelCallback) {
            // Create the toggle container element
            let toggleContainer = CreateDiv('toggle-container');
            toggleContainer.setAttribute('id', toggleId);
            toggleContainer.setAttribute('data-state', options.initialState || 'male');

            // Create toggle options and append them
            options.labels.forEach((label, index) => {
                let option = CreateDiv('toggle-option');
                option.textContent = label;
                toggleContainer.appendChild(option);
            });

            // Create and append the slider
            let slider = CreateDiv('toggle-slider');
            toggleContainer.appendChild(slider);

            // Create a toolbar button to hold our custom toggle
            let toggleButton = new ToolbarButton(null, 'Gender Toggle', null);
            toggleButton.buttonDiv.className += ' toolbar-button';
            toggleButton.buttonDiv.style.width = 'auto'; // Allow the button to expand
            toggleButton.buttonDiv.style.marginLeft = '0px'; // Add some space

            let svgIcon = toggleButton.buttonDiv.querySelector('.ov_svg_icon');
            if (svgIcon) {
                svgIcon.remove();
            }
            toggleButton.buttonDiv.appendChild(toggleContainer);
            toggleButton.AddDomElements(toolbar.mainDiv);

            // Enhanced event listener for toggling state and loading models
            toggleContainer.addEventListener('click', function() {
                const currentState = this.getAttribute('data-state');
                const newState = currentState === 'male' ? 'female' : 'male';
                this.setAttribute('data-state', newState);

                if (newState === 'male') {
                    loadModelCallback(['assets/models/male_model.stl']);
                } else {
                    loadModelCallback(['assets/models/female_model.stl']);
                }
            });

            return toggleButton;
        }

        // AddSeparator (this.toolbar, ['only_on_model']);
        this.toolbarHighlightButton = AddPushButton(this.toolbar, 'highlight', Loc('Highlight'), ['only_full_width', 'only_on_model'], (isSelected) => {
            this.ToggleHighlightTool();
        });
        this.highlightTool.SetButton(this.toolbarHighlightButton);
        
        // Creating container for highlight button and brush size slider
        const highlightContainer = CreateDiv('highlight-container');

        const brushSizeSlider = this.highlightTool.CreateBrushSizeSlider();
        this.toolbar.mainDiv.appendChild(brushSizeSlider);
        // highlightContainer.appendChild(brushSizeSlider);
        highlightContainer.appendChild(this.toolbarHighlightButton.buttonDiv);


        // Add the slider to the container
        this.toolbar.mainDiv.appendChild(highlightContainer);
        this.toolbarHighlightButton.buttonDiv.style.margin = '0';

        this.toolbarEraserButton = AddPushButton(this.toolbar, 'eraser', Loc('Erase'), ['only_full_width', 'only_on_model'], (isSelected) => {
            this.ToggleEraserTool();
        });
        this.eraserTool.SetButton(this.toolbarEraserButton);

        // add event listener for highlightcontainer mouseover
        highlightContainer.addEventListener('mouseover', () => {
            this.highlightTool.ShowBrushSizeSlider();
        });3

        AddButton (this.toolbar, 'clear', Loc ('Erase All'), ['only_full_width', 'only_on_model'], () => {
            this.clearTool.ClearAllHighlights();
        });

        AddButton (this.toolbar, 'share', Loc ('Share'), ['only_full_width', 'only_on_model'], () => {
            ShowSharingDialog (this.settings, this.viewer);
        });
        AddButton (this.toolbar, 'up_y', Loc ('Reset View'), ['only_on_model'], () => {
            this.viewer.SetUpVector (Direction.Y, true);
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);



        AddToggle(this.toolbar, 'genderToggle',
            {labels: ['Male', 'Female'], initialState: 'male'},
            (modelUrl) => {
                this.LoadModelFromUrlList(modelUrl);
            }
        );

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

                if (this.highlightTool.IsActive()) {
                    this.highlightTool.UpdatePanel();
                }
            },
            onBackgroundColorChanged : () => {
                this.settings.SaveToCookies ();
                this.viewer.SetBackgroundColor (this.settings.backgroundColor);
                if (this.measureTool.IsActive ()) {
                    this.measureTool.UpdatePanel ();
                }

                if (this.highlightTool.IsActive()) {
                    this.highlightTool.UpdatePanel();
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
        acceptButton.addEventListener('click', () => {
            CookieSetBoolVal('ov_cookie_consent', true);
            popupDiv.remove();
        });
    }
    
    ToggleHighlightTool() {
        let isActive = !this.highlightTool.IsActive();
        this.highlightTool.SetActive(isActive);
        this.toolbarHighlightButton.SetSelected(isActive);
        HandleEvent('highlight_tool_activated', isActive ? 'on' : 'off');
        this.navigator.SetSelection(null);

        // Always enable navigation when highlight tool is deactivated
        if (!isActive) {
            this.viewer.navigation.EnableCameraMovement(true);
        }

        if (this.eraserTool.IsActive()) {
            this.eraserTool.SetActive(false);
            this.toolbarEraserButton.SetSelected(false);
        }
    }

    ToggleEraserTool() {
        let isActive = !this.eraserTool.IsActive();
        this.eraserTool.SetActive(isActive);
        this.toolbarEraserButton.SetSelected(isActive);
        HandleEvent('eraser_tool_activated', isActive ? 'on' : 'off');
        this.navigator.SetSelection(null);

        // Disable highlight tool when eraser is activated
        if (isActive) {
            this.highlightTool.SetActive(false);
            this.toolbarHighlightButton.SetSelected(false);
        }

        // Always enable navigation when eraser tool is deactivated
        if (!isActive) {
            this.viewer.navigation.EnableCameraMovement(true);
        }
    }

    ToggleClearTool() {
        this.eraserTool.ClearAll();
    }

    InitToggleSwitch() {
        const toggleContainer = document.querySelector('.toggle-container');

        if (toggleContainer) {
            toggleContainer.addEventListener('click', () => {
                const currentState = toggleContainer.getAttribute('data-state');
                const newState = currentState === 'male' ? 'female' : 'male';

                toggleContainer.setAttribute('data-state', newState);

                if (newState === 'male') {
                    // Load male model
                    this.LoadModelFromUrlList(['assets/models/male_model.stl']);
                } else {
                    // Load female model
                    this.LoadModelFromUrlList(['assets/models/female_model.stl']);
                }
            });
        } else {
            console.warn('Toggle switch element not found');
        }
    }

    

}
