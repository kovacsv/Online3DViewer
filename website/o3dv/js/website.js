OV.WebsiteUIState =
{
    Undefined : 0,
    Intro : 1,
    Model : 2,
    Loading : 3
};

OV.Website = class
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.settings = new OV.Settings ();
        this.viewer = new OV.Viewer ();
        this.hashHandler = new OV.HashHandler ();
        this.cookieHandler = new OV.CookieHandler ();
        this.toolbar = new OV.Toolbar (this.parameters.toolbarDiv);
        this.navigator = new OV.Navigator (this.parameters.navigatorDiv, this.parameters.navigatorSplitterDiv);
        this.sidebar = new OV.Sidebar (this.parameters.sidebarDiv, this.parameters.sidebarSplitterDiv, this.settings);
        this.eventHandler = new OV.EventHandler (this.parameters.eventHandler);
        this.modelLoader = new OV.ThreeModelLoader ();
        this.themeHandler = new OV.ThemeHandler ();
        this.highlightColor = new THREE.Color (0x8ec9f0);
        this.uiState = OV.WebsiteUIState.Undefined;
        this.model = null;
        this.dialog = null;
    }

    Load ()
    {
        this.settings.LoadFromCookies (this.cookieHandler);
        this.SwitchTheme (this.settings.themeId, false);

        this.InitViewer ();
        this.InitToolbar ();
        this.InitDragAndDrop ();
        this.InitModelLoader ();
        this.InitSidebar ();
        this.InitNavigator ();
        this.InitCookieConsent ();

        this.viewer.SetClickHandler (this.OnModelClicked.bind (this));
        this.viewer.SetContextMenuHandler (this.OnModelContextMenu.bind (this));

        this.Resize ();
        this.SetUIState (OV.WebsiteUIState.Intro);

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        this.OnHashChange ();

        OV.AddSmallWidthChangeEventListener (() => {
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
        if (!OV.IsSmallWidth ()) {
            navigatorWidth = this.navigator.GetWidth ();
            sidebarWidth = this.sidebar.GetWidth ();
        }

        const minContentWidth = 50;
        let contentWidth = windowWidth - navigatorWidth - sidebarWidth;
        if (contentWidth < minContentWidth) {
            this.sidebar.DecreaseWidth (minContentWidth - contentWidth);
            contentWidth = minContentWidth;
        }
        let contentHeight = windowHeight - headerHeight;

        OV.SetDomElementOuterHeight (this.parameters.introDiv, contentHeight);
        this.navigator.Resize (contentHeight);
        this.sidebar.Resize (contentHeight);
        this.viewer.Resize (contentWidth, contentHeight);
    }

    OnSmallWidthChanged ()
    {
        if (this.uiState === OV.WebsiteUIState.Model) {
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
        if (this.uiState === OV.WebsiteUIState.Intro) {
            OV.ShowDomElement (this.parameters.introDiv);
            OV.HideDomElement (this.parameters.mainDiv);
            ShowOnlyOnModelElements (false);
        } else if (this.uiState === OV.WebsiteUIState.Model) {
            OV.HideDomElement (this.parameters.introDiv);
            OV.ShowDomElement (this.parameters.mainDiv);
            ShowOnlyOnModelElements (true);
            this.UpdatePanelsVisibility ();
        } else if (this.uiState === OV.WebsiteUIState.Loading) {
            OV.HideDomElement (this.parameters.introDiv);
            OV.HideDomElement (this.parameters.mainDiv);
            ShowOnlyOnModelElements (false);
        }

        this.Resize ();
    }

    ClearModel ()
    {
        this.HidePopups ();
        this.model = null;
        this.parameters.fileNameDiv.innerHTML = '';
        this.viewer.Clear ();
        this.navigator.Clear ();
        this.sidebar.Clear ();
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
        if (button === 1) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse (mouseCoordinates);
            if (meshUserData === null) {
                this.navigator.SetSelection (null);
            } else {
                this.navigator.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshUserData.originalMeshId));
            }
        }
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
        this.dialog = OV.ShowListPopup (items, {
            calculatePosition : (contentDiv) => {
                return OV.CalculatePopupPositionToScreen (globalMouseCoordinates, contentDiv);
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
            let importSettings = new OV.ImportSettings ();
            importSettings.defaultColor = this.settings.defaultColor;
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                importSettings.defaultColor = defaultColor;
            }
            this.eventHandler.HandleEvent ('model_load_started', { source : 'hash' });
            this.LoadModelFromUrlList (urls, importSettings);
        } else {
            this.ClearModel ();
            this.SetUIState (OV.WebsiteUIState.Intro);
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
        let hasDefaultMaterial = OV.HasDefaultMaterial (this.model);
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
        this.modelLoader.LoadFromUrlList (urls, settings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    LoadModelFromFileList (files)
    {
        let importSettings = new OV.ImportSettings ();
        importSettings.defaultColor = this.settings.defaultColor;
        this.modelLoader.LoadFromFileList (files, importSettings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    ClearHashIfNotOnlyUrlList ()
    {
        let importer = this.modelLoader.GetImporter ();
        let isOnlyUrl = importer.GetFileList ().IsOnlyUrlSource ();
        if (!isOnlyUrl && this.hashHandler.HasHash ()) {
            this.hashHandler.SkipNextEventHandler ();
            this.hashHandler.ClearHash ();
        }
    }

    SwitchTheme (newThemeId, resetColors)
    {
        this.settings.themeId = newThemeId;
        this.themeHandler.SwitchTheme (this.settings.themeId);
        this.settings.SaveToCookies (this.cookieHandler);
        if (resetColors) {
            this.settings.SaveToCookies (this.cookieHandler);
            this.viewer.SetBackgroundColor (this.settings.backgroundColor);
            if (this.modelLoader.defaultMaterial !== null) {
                OV.ReplaceDefaultMaterialColor (this.model, this.settings.defaultColor);
                this.modelLoader.ReplaceDefaultMaterialColor (this.settings.defaultColor);
            }
        }
    }

    InitViewer ()
    {
        let canvas = OV.AddDomElement (this.parameters.viewerDiv, 'canvas');
        this.viewer.Init (canvas);
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

    InitToolbar ()
    {
        function AddButton (toolbar, eventHandler, imageName, imageTitle, classNames, onClick)
        {
            let button = toolbar.AddImageButton (imageName, imageTitle, () => {
                eventHandler.HandleEvent ('toolbar_clicked', { item : imageName });
                onClick ();
            });
            if (classNames !== null) {
                for (let className of classNames) {
                    button.AddClass (className);
                }
            }
            return button;
        }

        function AddRadioButton (toolbar, eventHandler, imageNames, imageTitles, selectedIndex, classNames, onClick)
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
                eventHandler.HandleEvent ('toolbar_clicked', { item : imageNames[buttonIndex] });
                onClick (buttonIndex);
            });
            if (classNames !== null) {
                for (let className of classNames) {
                    for (let button of buttons) {
                        button.AddClass (className);
                    }
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

        let importer = this.modelLoader.GetImporter ();

        AddButton (this.toolbar, this.eventHandler, 'open', 'Open model from your device', null, () => {
            this.OpenFileBrowserDialog ();
        });
        AddButton (this.toolbar, this.eventHandler, 'open_url', 'Open model from a url', null, () => {
            this.dialog = OV.ShowOpenUrlDialog ((urls) => {
                if (urls.length > 0) {
                    this.hashHandler.SetModelFilesToHash (urls);
                }
            });
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddButton (this.toolbar, this.eventHandler, 'fit', 'Fit model to window', ['only_on_model'], () => {
            this.FitModelToWindow (false);
        });
        AddButton (this.toolbar, this.eventHandler, 'up_y', 'Set Y axis as up vector', ['only_on_model'], () => {
            this.viewer.SetUpVector (OV.Direction.Y, true);
        });
        AddButton (this.toolbar, this.eventHandler, 'up_z', 'Set Z axis as up vector', ['only_on_model'], () => {
            this.viewer.SetUpVector (OV.Direction.Z, true);
        });
        AddButton (this.toolbar, this.eventHandler, 'flip', 'Flip up vector', ['only_on_model'], () => {
            this.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar, ['only_on_model']);
        AddRadioButton (this.toolbar, this.eventHandler, ['fix_up_on', 'fix_up_off'], ['Fixed up vector', 'Free orbit'], 0, ['only_on_model'], (buttonIndex) => {
            if (buttonIndex === 0) {
                this.viewer.SetFixUpVector (true);
            } else if (buttonIndex === 1) {
                this.viewer.SetFixUpVector (false);
            }
        });
        AddSeparator (this.toolbar, ['only_full_width', 'only_on_model']);
        AddButton (this.toolbar, this.eventHandler, 'export', 'Export model', ['only_full_width', 'only_on_model'], () => {
            let exportDialog = new OV.ExportDialog ({
                onDialog : (dialog) => {
                    this.dialog = dialog;
                }
            });
            exportDialog.Show (this.model, this.viewer);
        });
        AddButton (this.toolbar, this.eventHandler, 'share', 'Share model', ['only_full_width', 'only_on_model'], () => {
            this.dialog = OV.ShowSharingDialog (importer, this.settings, this.viewer.GetCamera ());
        });

        this.parameters.fileInput.addEventListener ('change', (ev) => {
            if (ev.target.files.length > 0) {
                this.eventHandler.HandleEvent ('model_load_started', { source : 'open_file' });
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
            OV.GetFilesFromDataTransfer (ev.dataTransfer, (files) => {
                if (files.length > 0) {
                    this.eventHandler.HandleEvent ('model_load_started', { source : 'drop' });
                    this.LoadModelFromFileList (files);
                }
            });
        }, false);
    }

    InitModelLoader ()
    {
        OV.InitModelLoader (this.modelLoader, {
            onStart : () =>
            {
                this.SetUIState (OV.WebsiteUIState.Loading);
                this.ClearModel ();
            },
            onFinish : (importResult, threeObject) =>
            {
                this.SetUIState (OV.WebsiteUIState.Model);
                this.OnModelLoaded (importResult, threeObject);
                let importedExtension = OV.GetFileExtension (importResult.mainFile);
                this.eventHandler.HandleEvent ('model_loaded', { extension : importedExtension });
            },
            onRender : () =>
            {
                this.viewer.Render ();
            },
            onError : (importError) =>
            {
                this.SetUIState (OV.WebsiteUIState.Intro);
                let reason = 'unknown';
                if (importError.code === OV.ImportErrorCode.NoImportableFile) {
                    reason = 'no_importable_file';
                } else if (importError.code === OV.ImportErrorCode.ImportFailed) {
                    reason = 'import_failed';
                }
                let extensions = [];
                let importer = this.modelLoader.GetImporter ();
                let fileList = importer.GetFileList ().GetFiles ();
                for (let i = 0; i < fileList.length; i++) {
                    extensions.push (fileList[i].extension);
                }
                this.eventHandler.HandleEvent ('model_load_failed', {
                    reason : reason,
                    extensions : extensions
                });
            }
        });
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
                if (this.modelLoader.defaultMaterial !== null) {
                    OV.ReplaceDefaultMaterialColor (this.model, this.settings.defaultColor);
                    this.modelLoader.ReplaceDefaultMaterialColor (this.settings.defaultColor);
                }
                this.viewer.Render ();
            },
            onThemeChange : () => {
                this.SwitchTheme (this.settings.themeId, true);
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

        OV.ShowCookieDialog (() => {
            this.cookieHandler.SetBoolVal ('ov_cookie_consent', true);
        });
    }
};
