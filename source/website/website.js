import { GetFileExtension, TransformFileHostUrls } from '../engine/io/fileutils.js';
import { InputFilesFromFileObjects, InputFilesFromUrls } from '../engine/import/importerfiles.js';
import { ImportErrorCode, ImportSettings } from '../engine/import/importer.js';
import { NavigationMode, ProjectionMode } from '../engine/viewer/camera.js';
import { RGBColor } from '../engine/model/color.js';
import { Viewer } from '../engine/viewer/viewer.js';
import { AddDiv, AddDomElement, ShowDomElement, SetDomElementOuterHeight, CreateDomElement, GetDomElementOuterWidth, GetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToScreen, ShowListPopup } from './dialogs.js';
import { HandleEvent } from './eventhandler.js';
import { HashHandler } from './hashhandler.js';
import { Navigator, Selection, SelectionType } from './navigator.js';
import { CameraSettings, Settings, Theme } from './settings.js';
import { Sidebar } from './sidebar.js';
import { ThemeHandler } from './themehandler.js';
import { ThreeModelLoaderUI } from './threemodelloaderui.js';
import { Toolbar } from './toolbar.js';
import { ShowSnapshotDialog } from './snapshotdialog.js';
import { AddSvgIconElement, GetFilesFromDataTransfer, InstallTooltip, IsSmallWidth } from './utils.js';
import { ShowOpenUrlDialog } from './openurldialog.js';
import { GetDefaultMaterials, ReplaceDefaultMaterialsColor } from '../engine/model/modelutils.js';
import { Direction } from '../engine/geometry/geometry.js';
import { CookieGetBoolVal, CookieSetBoolVal } from './cookiehandler.js';
import { MeasureTool } from './measuretool.js';
import { CloseAllDialogs } from './dialog.js';
import { CreateVerticalSplitter } from './splitter.js';
import { EnumeratePlugins, PluginType } from './pluginregistry.js';
import { EnvironmentSettings } from '../engine/viewer/shadingmodel.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { Loc } from '../engine/core/localization.js';

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

        let introContentHeight = GetDomElementOuterHeight (this.parameters.introContentDiv);
        let introContentTop =
(contentHeight - introContentHeight) / 3.0;
        this.parameters.introContentDiv.style.top = introContentTop.toString () + 'px';

        this.measureTool.Resize ();
    }
}

class Website
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

        this.viewer.SetMouseClickHandler (this.OnModelClicked.bind (this));
        this.viewer.SetMouseMoveHandler (this.OnModelMouseMoved.bind (this));
        this.viewer.SetContextMenuHandler (this.OnModelContextMenu.bind (this));

        this.layouter.Init ();
        this.SetUIState (WebsiteUIState.Intro);

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        this.OnHashChange ();

        window.addEventListener ('resize', () => {
            this.layouter.Resize ();
        });
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
            this.navigator.SetSelection (null);
            this.measureTool.SetActive (isSelected);
        });
        this.measureTool.SetButton (measureToolButton);
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
    }
}