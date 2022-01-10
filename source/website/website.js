import { FileSource, GetFileExtension, TransformFileHostUrls } from '../engine/io/fileutils.js';
import { ImportErrorCode, ImportSettings } from '../engine/import/importer.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { MeasureTool } from '../engine/viewer/measuretool.js';
import { AddDiv, AddDomElement, ShowDomElement, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CookieHandler } from './cookies.js';
import { CalculatePopupPositionToScreen, ShowListPopup } from './dialogs.js';
import { EventHandler } from './eventhandler.js';
import { HashHandler } from './hashhandler.js';
import { Navigator, Selection, SelectionType } from './navigator.js';
import { Settings, Theme } from './settings.js';
import { Sidebar } from './sidebar.js';
import { ThemeHandler } from './themehandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';
import { Toolbar } from './toolbar.js';
import { ExportDialog } from './exportdialog.js';
import { AddSmallWidthChangeEventListener, GetFilesFromDataTransfer, IsSmallWidth } from './utils.js';
import { ShowOpenUrlDialog } from './openurldialog.js';
import { ShowSharingDialog } from './sharingdialog.js';
import { HasDefaultMaterial, ReplaceDefaultMaterialColor } from '../engine/model/modelutils.js';
import { Direction } from '../engine/geometry/geometry.js';

export const WebsiteUIState =
{
    Undefined : 0,
    Intro : 1,
    Model : 2,
    Loading : 3
};

export class Website
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.settings = new Settings ();
        this.viewer = new Viewer ();
        this.measureTool = new MeasureTool ();
        this.hashHandler = new HashHandler ();
        this.cookieHandler = new CookieHandler ();
        this.toolbar = new Toolbar (this.parameters.toolbarDiv);
        this.navigator = new Navigator (this.parameters.navigatorDiv, this.parameters.navigatorSplitterDiv);
        this.sidebar = new Sidebar (this.parameters.sidebarDiv, this.parameters.sidebarSplitterDiv, this.settings, this.measureTool);
        this.eventHandler = new EventHandler (this.parameters.eventHandler);
        this.modelLoaderUI = new ThreeModelLoaderUI ();
        this.themeHandler = new ThemeHandler ();
        this.highlightColor = new THREE.Color (0x8ec9f0);
        this.uiState = WebsiteUIState.Undefined;
        this.model = null;
        this.dialog = null;
    }

    Load ()
    {
        this.settings.LoadFromCookies (this.cookieHandler);
        this.SwitchTheme (this.settings.themeId, false);
        this.eventHandler.HandleEvent ('theme_on_load', this.settings.themeId === Theme.Light ? 'light' : 'dark');

        this.InitViewer ();
        this.InitMeasureTool ();
        this.InitToolbar ();
        this.InitDragAndDrop ();
        this.InitSidebar ();
        this.InitNavigator ();
        this.InitCookieConsent ();

        this.viewer.SetMouseClickHandler (this.OnModelClicked.bind (this));
        this.viewer.SetMouseMoveHandler (this.OnModelMouseMoved.bind (this));
        this.viewer.SetContextMenuHandler (this.OnModelContextMenu.bind (this));

        this.Resize ();
        this.SetUIState (WebsiteUIState.Intro);

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        this.OnHashChange ();

        AddSmallWidthChangeEventListener (() => {
            this.OnSmallWidthChanged ();
        });

        window.addEventListener ('resize', () => {
			this.Resize ();
		});
    }

    Resize ()
    {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let headerHeight = this.parameters.headerDiv.offsetHeight;

        let navigatorWidth = 0;
        let sidebarWidth = 0;
        let safetyMargin = 0;
        if (!IsSmallWidth ()) {
            navigatorWidth = this.navigator.GetWidth ();
            sidebarWidth = this.sidebar.GetWidth ();
            safetyMargin = 1;
        }

        const minContentWidth = 50;
        let contentWidth = windowWidth - navigatorWidth - sidebarWidth;
        if (contentWidth < minContentWidth) {
            this.sidebar.DecreaseWidth (minContentWidth - contentWidth);
            contentWidth = minContentWidth;
        }
        let contentHeight = windowHeight - headerHeight;

        SetDomElementOuterHeight (this.parameters.introDiv, contentHeight);
        this.navigator.Resize (contentHeight);
        this.sidebar.Resize (contentHeight);
        this.viewer.Resize (contentWidth - safetyMargin, contentHeight);
    }

    OnSmallWidthChanged ()
    {
        if (this.uiState === WebsiteUIState.Model) {
            this.UpdatePanelsVisibility ();
        }
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
            ShowDomElement (this.parameters.mainDiv, false);
            ShowOnlyOnModelElements (false);
        } else if (this.uiState === WebsiteUIState.Model) {
            ShowDomElement (this.parameters.introDiv, false);
            ShowDomElement (this.parameters.mainDiv, true);
            ShowOnlyOnModelElements (true);
            this.UpdatePanelsVisibility ();
        } else if (this.uiState === WebsiteUIState.Loading) {
            ShowDomElement (this.parameters.introDiv, false);
            ShowDomElement (this.parameters.mainDiv, false);
            ShowOnlyOnModelElements (false);
        }

        this.Resize ();
    }

    ClearModel ()
    {
        this.HidePopups ();

        this.model = null;
        this.viewer.Clear ();

        this.parameters.fileNameDiv.innerHTML = '';

        this.navigator.Clear ();
        this.sidebar.Clear ();

        this.measureTool.Clear ();
        this.sidebar.UpdateMeasureTool ();
    }

    OnModelLoaded (importResult, threeObject)
    {
        this.model = importResult.model;
        this.parameters.fileNameDiv.innerHTML = importResult.mainFile;
        this.viewer.SetMainObject (threeObject);
        this.viewer.SetUpVector (importResult.upVector, false);
        this.navigator.FillTree (importResult);
        this.UpdateSidebar ();
        this.FitModelToWindow (true);
    }

    OnModelClicked (button, mouseCoordinates)
    {
        if (button !== 1) {
            return;
        }

        if (this.measureTool.IsActive ()) {
            this.measureTool.Click (mouseCoordinates);
            this.sidebar.UpdateMeasureTool ();
            return;
        }

        let meshUserData = this.viewer.GetMeshUserDataUnderMouse (mouseCoordinates);
        if (meshUserData === null) {
            this.navigator.SetSelection (null);
        } else {
            this.navigator.SetSelection (new Selection (SelectionType.Mesh, meshUserData.originalMeshId));
        }
    }

    OnModelMouseMoved (mouseCoordinates)
    {

    }

    OnModelContextMenu (globalMouseCoordinates, mouseCoordinates)
    {
        let meshUserData = this.viewer.GetMeshUserDataUnderMouse (mouseCoordinates);
        let items = [];
        if (meshUserData === null) {
            items.push ({
                name : 'Fit model to window',
                icon : 'fit',
                onClick : () => {
                    this.FitModelToWindow (false);
                }
            });
            if (this.navigator.HasHiddenMesh ()) {
                items.push ({
                    name : 'Show all meshes',
                    icon : 'visible',
                    onClick : () => {
                        this.navigator.ShowAllMeshes (true);
                    }
                });
            }
        } else {
            items.push ({
                name : 'Hide mesh',
                icon : 'hidden',
                onClick : () => {
                    this.navigator.ToggleMeshVisibility (meshUserData.originalMeshId);
                }
            });
            items.push ({
                name : 'Fit mesh to window',
                icon : 'fit',
                onClick : () => {
                    this.navigator.FitMeshToWindow (meshUserData.originalMeshId);
                }
            });
            if (this.navigator.MeshItemCount () > 1) {
                let isMeshIsolated = this.navigator.IsMeshIsolated (meshUserData.originalMeshId);
                items.push ({
                    name : isMeshIsolated ? 'Remove isolation' : 'Isolate mesh',
                    icon : isMeshIsolated ? 'deisolate' : 'isolate',
                    onClick : () => {
                        if (isMeshIsolated) {
                            this.navigator.ShowAllMeshes (true);
                        } else {
                            this.navigator.IsolateMesh (meshUserData.originalMeshId);
                        }
                    }
                });
            }
        }
        this.dialog = ShowListPopup (items, {
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
            importSettings.defaultColor = this.settings.defaultColor;
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                importSettings.defaultColor = defaultColor;
            }
            this.eventHandler.HandleEvent ('model_load_started', 'hash');
            this.LoadModelFromUrlList (urls, importSettings);
        } else {
            this.ClearModel ();
            this.SetUIState (WebsiteUIState.Intro);
        }
    }

    HidePopups ()
    {
        if (this.dialog !== null) {
            this.dialog.Hide ();
            this.dialog = null;
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
            return this.navigator.IsMeshVisible (meshUserData.originalMeshId);
        });
        if (onLoad) {
            this.viewer.AdjustClippingPlanesToSphere (boundingSphere);
        }
        this.viewer.FitSphereToWindow (boundingSphere, animation);
    }

    FitMeshToWindow (meshInstanceId)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return meshUserData.originalMeshId.IsEqual (meshInstanceId);
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
            return meshInstanceIdKeys.has (meshUserData.originalMeshId.GetKey ());
        });
        this.viewer.FitSphereToWindow (boundingSphere, true);
    }

    UpdateSidebar ()
    {
        let hasDefaultMaterial = HasDefaultMaterial (this.model);
        this.sidebar.UpdateSettings (hasDefaultMaterial);
    }

    UpdateMeshesVisibility ()
    {
        this.viewer.SetMeshesVisibility ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshId);
        });
    }

    UpdateMeshesSelection ()
    {
        let selectedMeshId = this.navigator.GetSelectedMeshId ();
        this.viewer.SetMeshesHighlight (this.highlightColor, (meshUserData) => {
            if (selectedMeshId !== null && meshUserData.originalMeshId.IsEqual (selectedMeshId)) {
                return true;
            }
            return false;
        });
    }

    LoadModelFromUrlList (urls, settings)
    {
        this.LoadModel (urls, FileSource.Url, settings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    LoadModelFromFileList (files)
    {
        let importSettings = new ImportSettings ();
        importSettings.defaultColor = this.settings.defaultColor;
        this.LoadModel (files, FileSource.File, importSettings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    LoadModel (files, fileSource, settings)
    {
        this.modelLoaderUI.LoadModel (files, fileSource, settings, {
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
                this.eventHandler.HandleEvent ('model_loaded', importedExtension);
            },
            onRender : () =>
            {
                this.viewer.Render ();
            },
            onError : (importError) =>
            {
                this.SetUIState (WebsiteUIState.Intro);
                let extensions = [];
                let importer = this.modelLoaderUI.GetImporter ();
                let fileList = importer.GetFileList ().GetFiles ();
                for (let i = 0; i < fileList.length; i++) {
                    extensions.push (fileList[i].extension);
                }
                let extensionsStr = extensions.join (',');
                if (importError.code === ImportErrorCode.NoImportableFile) {
                    this.eventHandler.HandleEvent ('no_importable_file', extensionsStr);
                } else if (importError.code === ImportErrorCode.FailedToLoadFile) {
                    this.eventHandler.HandleEvent ('failed_to_load_file', extensionsStr);
                } else if (importError.code === ImportErrorCode.ImportFailed) {
                    this.eventHandler.HandleEvent ('import_failed', extensionsStr);
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

    UpdateGridDisplay ()
    {
        this.settings.SaveToCookies (this.cookieHandler);
        this.viewer.SetGridSettings (this.settings.showGrid);
    }

    UpdateEdgeDisplay ()
    {
        this.settings.SaveToCookies (this.cookieHandler);
        this.viewer.SetEdgeSettings (this.settings.showEdges, this.settings.edgeColor, this.settings.edgeThreshold);
    }

    SwitchTheme (newThemeId, resetColors)
    {
        this.settings.themeId = newThemeId;
        this.themeHandler.SwitchTheme (this.settings.themeId);
        this.settings.SaveToCookies (this.cookieHandler);
        if (resetColors) {
            this.settings.SaveToCookies (this.cookieHandler);
            this.viewer.SetBackgroundColor (this.settings.backgroundColor);
            let modelLoader = this.modelLoaderUI.GetModelLoader ();
            if (modelLoader.GetDefaultMaterial () !== null) {
                ReplaceDefaultMaterialColor (this.model, this.settings.defaultColor);
                modelLoader.ReplaceDefaultMaterialColor (this.settings.defaultColor);
            }
        }
    }

    InitViewer ()
    {
        let canvas = AddDomElement (this.parameters.viewerDiv, 'canvas');
        this.viewer.Init (canvas);
        this.viewer.SetGridSettings (this.settings.showGrid);
        this.viewer.SetEdgeSettings (this.settings.showEdges, this.settings.edgeColor, this.settings.edgeThreshold);
        this.viewer.SetBackgroundColor (this.settings.backgroundColor);
        this.viewer.SetEnvironmentMap ([
            'assets/envmaps/grayclouds/posx.jpg',
            'assets/envmaps/grayclouds/negx.jpg',
            'assets/envmaps/grayclouds/posy.jpg',
            'assets/envmaps/grayclouds/negy.jpg',
            'assets/envmaps/grayclouds/posz.jpg',
            'assets/envmaps/grayclouds/negz.jpg'
        ]);
    }

    InitMeasureTool ()
    {
        this.measureTool.Init (this.viewer, this.highlightColor);
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

        AddButton (this.toolbar, 'open', 'Open model from your device', [], () => {
            this.OpenFileBrowserDialog ();
        });
        AddButton (this.toolbar, 'open_url', 'Open model from a url', [], () => {
            this.dialog = ShowOpenUrlDialog ((urls) => {
                if (urls.length > 0) {
                    this.hashHandler.SetModelFilesToHash (urls);
                }
            });
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddButton (this.toolbar, 'fit', 'Fit model to window', ['only_on_model'], () => {
            this.FitModelToWindow (false);
        });
        AddButton (this.toolbar, 'up_y', 'Set Y axis as up vector', ['only_on_model'], () => {
            this.viewer.SetUpVector (Direction.Y, true);
        });
        AddButton (this.toolbar, 'up_z', 'Set Z axis as up vector', ['only_on_model'], () => {
            this.viewer.SetUpVector (Direction.Z, true);
        });
        AddButton (this.toolbar, 'flip', 'Flip up vector', ['only_on_model'], () => {
            this.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddRadioButton (this.toolbar, ['fix_up_on', 'fix_up_off'], ['Fixed up vector', 'Free orbit'], 0, ['only_on_model'], (buttonIndex) => {
            if (buttonIndex === 0) {
                this.viewer.SetFixUpVector (true);
            } else if (buttonIndex === 1) {
                this.viewer.SetFixUpVector (false);
            }
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        AddButton (this.toolbar, 'export', 'Export model', ['only_full_width', 'only_on_model'], () => {
            let exportDialog = new ExportDialog ({
                isMeshVisible : (meshInstanceId) => {
                    return this.navigator.IsMeshVisible (meshInstanceId);
                },
                onDialog : (dialog) => {
                    this.dialog = dialog;
                }
            }, this.eventHandler);
            exportDialog.Show (this.model, this.viewer);
        });
        AddButton (this.toolbar, 'share', 'Share model', ['only_full_width', 'only_on_model'], () => {
            this.dialog = ShowSharingDialog (importer.GetFileList (), this.settings, this.viewer.GetCamera (), this.eventHandler);
        });

        this.parameters.fileInput.addEventListener ('change', (ev) => {
            if (ev.target.files.length > 0) {
                this.eventHandler.HandleEvent ('model_load_started', 'open_file');
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
                    this.eventHandler.HandleEvent ('model_load_started', 'drop');
                    this.LoadModelFromFileList (files);
                }
            });
        }, false);
    }

    InitSidebar ()
    {
        this.sidebar.Init ({
            onBackgroundColorChange : () => {
                this.settings.SaveToCookies (this.cookieHandler);
                this.viewer.SetBackgroundColor (this.settings.backgroundColor);
            },
            onDefaultColorChange : () => {
                this.settings.SaveToCookies (this.cookieHandler);
                let modelLoader = this.modelLoaderUI.GetModelLoader ();
                if (modelLoader.GetDefaultMaterial () !== null) {
                    ReplaceDefaultMaterialColor (this.model, this.settings.defaultColor);
                    modelLoader.ReplaceDefaultMaterialColor (this.settings.defaultColor);
                }
                this.viewer.Render ();
            },
            onGridDisplayChange : () => {
                this.UpdateGridDisplay ();
            },
            onEdgeDisplayChange : () => {
                this.eventHandler.HandleEvent ('edge_display_changed', this.settings.showEdges ? 'on' : 'off');
                this.UpdateEdgeDisplay ();
            },
            onThemeChange : () => {
                this.eventHandler.HandleEvent ('theme_changed', this.settings.themeId === Theme.Light ? 'light' : 'dark');
                this.SwitchTheme (this.settings.themeId, true);
            },
            onMeasureToolActivedChange : (isActivated) => {
                if (isActivated) {
                    this.navigator.SetSelection (null);
                    this.measureTool.SetActive (true);
                } else {
                    this.measureTool.SetActive (false);
                }
                this.sidebar.UpdateMeasureTool ();
            },
            onResize : () => {
                this.Resize ();
            },
            onShowHidePanels : (show) => {
                this.cookieHandler.SetBoolVal ('ov_show_sidebar', show);
            }
        });
    }

    InitNavigator ()
    {
        function GetMeshUserData (viewer, meshInstanceId)
        {
            let userData = null;
            viewer.EnumerateMeshesUserData ((meshUserData) => {
                if (meshUserData.originalMeshId.IsEqual (meshInstanceId)) {
                    userData = meshUserData;
                }
            });
            return userData;
        }

        function GetMeshesForMaterial (viewer, model, materialIndex)
        {
            let usedByMeshes = [];
            viewer.EnumerateMeshesUserData ((meshUserData) => {
                if (materialIndex === null || meshUserData.originalMaterials.indexOf (materialIndex) !== -1) {
                    const mesh = model.GetMesh (meshUserData.originalMeshId.meshIndex);
                    usedByMeshes.push ({
                        meshId : meshUserData.originalMeshId,
                        name : mesh.GetName ()
                    });
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
                let userData = GetMeshUserData (viewer, meshInstanceId);
                for (let i = 0; i < userData.originalMaterials.length; i++) {
                    const materialIndex = userData.originalMaterials[i];
                    usedMaterials.push (GetMaterialReferenceInfo (model, materialIndex));
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
            updateMeshesVisibility : () => {
                this.UpdateMeshesVisibility ();
            },
            updateMeshesSelection : () => {
                this.UpdateMeshesSelection ();
            },
            fitMeshToWindow : (meshInstanceId) => {
                this.FitMeshToWindow (meshInstanceId);
            },
            fitMeshesToWindow : (meshInstanceIdSet) => {
                this.FitMeshesToWindow (meshInstanceIdSet);
            },
            getMeshesForMaterial : (materialIndex) => {
                return GetMeshesForMaterial (this.viewer, this.model, materialIndex);
            },
            getMaterialsForMesh : (meshInstanceId) => {
                return GetMaterialsForMesh (this.viewer, this.model, meshInstanceId);
            },
            onModelSelected : () => {
                this.sidebar.AddObject3DProperties (this.model);
            },
            onMeshSelected : (meshInstanceId) => {
                let meshInstance = this.model.GetMeshInstance (meshInstanceId);
                this.sidebar.AddObject3DProperties (meshInstance);
            },
            onMaterialSelected : (materialIndex) => {
                this.sidebar.AddMaterialProperties (this.model.GetMaterial (materialIndex));
            },
            onResize : () => {
                this.Resize ();
            },
            onShowHidePanels : (show) => {
                this.cookieHandler.SetBoolVal ('ov_show_navigator', show);
            }
        });
    }

    UpdatePanelsVisibility ()
    {
        let showNavigator = this.cookieHandler.GetBoolVal ('ov_show_navigator', true);
        let showSidebar = this.cookieHandler.GetBoolVal ('ov_show_sidebar', true);
        this.navigator.ShowPanels (showNavigator);
        this.sidebar.ShowPanels (showSidebar);
    }

    InitCookieConsent ()
    {
        let accepted = this.cookieHandler.GetBoolVal ('ov_cookie_consent', false);
        if (accepted) {
            return;
        }

        let text = 'This website uses cookies to offer you better user experience. See the details at the <a target="_blank" href="info/cookies.html">Cookies Policy</a> page.';
        let popupDiv = AddDiv (document.body, 'ov_bottom_floating_panel');
        AddDiv (popupDiv, 'ov_floating_panel_text', text);
        let acceptButton = AddDiv (popupDiv, 'ov_button ov_floating_panel_button', 'Accept');
        acceptButton.addEventListener ('click', () => {
            this.cookieHandler.SetBoolVal ('ov_cookie_consent', true);
            popupDiv.remove ();
        });
    }
}
