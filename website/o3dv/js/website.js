OV.WebsiteUIState =
{
    Intro : 1,
    Model : 2,
    Loading : 3
};

OV.Website = class
{
    constructor (parameters)
    {
        this.parameters = parameters;
        this.viewer = new OV.Viewer ();
        this.hashHandler = new OV.HashHandler ();
        this.cookieHandler = new OV.CookieHandler ();
        this.toolbar = new OV.Toolbar (this.parameters.toolbarDiv);
        this.sidebar = new OV.Sidebar (this.parameters.sidebarDiv);
        this.navigator = new OV.Navigator (this.parameters.navigatorDiv);
        this.eventHandler = new OV.EventHandler (this.parameters.eventHandler);
        this.settings = new OV.Settings ();
        this.modelLoader = new OV.ThreeModelLoader ();
        this.highlightMaterial = new THREE.MeshPhongMaterial ({
            color : 0x8ec9f0,
            side : THREE.DoubleSide
        });
        this.themeHandler = new OV.ThemeHandler ();
        this.detailsPanel = null;
        this.settingsPanel = null;
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

        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));
        this.OnHashChange ();

        $(window).on ('resize', () => {
			this.Resize ();
		});
    }

    Resize ()
    {
        let windowWidth = $(window).outerWidth ();
        let windowHeight = $(window).outerHeight ();
        let headerHeight = parseInt (this.parameters.headerDiv.outerHeight (true), 10);

        let navigatorWidth = 0;
        let sidebarWidth = 0;
        let safetyMargin = 0;
        if (!OV.IsSmallWidth ()) {
            navigatorWidth = parseInt (this.parameters.navigatorDiv.outerWidth (true), 10);
            if (this.sidebar.IsVisible ()) {
                sidebarWidth = parseInt (this.parameters.sidebarDiv.outerWidth (true), 10);
            }
            safetyMargin = 1;
        }
        
        let contentWidth = windowWidth - navigatorWidth - sidebarWidth - safetyMargin;
        let contentHeight = windowHeight - headerHeight - safetyMargin;
        
        this.parameters.navigatorDiv.outerHeight (contentHeight, true);
        this.parameters.sidebarDiv.outerHeight (contentHeight, true);
        this.parameters.introDiv.outerHeight (contentHeight, true);

        this.navigator.Resize ();
        this.sidebar.Resize ();
        this.viewer.Resize (contentWidth, contentHeight);
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
        
        if (uiState === OV.WebsiteUIState.Intro) {
            this.parameters.introDiv.show ();
            this.parameters.mainDiv.hide ();
            ShowOnlyOnModelElements (false);
        } else if (uiState === OV.WebsiteUIState.Model) {
            this.parameters.introDiv.hide ();
            this.parameters.mainDiv.show ();
            ShowOnlyOnModelElements (true);
        } else if (uiState === OV.WebsiteUIState.Loading) {
            this.parameters.introDiv.hide ();
            this.parameters.mainDiv.hide ();
            ShowOnlyOnModelElements (false);
        }

        this.Resize ();
    }

    ClearModel ()
    {
        this.HidePopups ();
        this.model = null;
        this.viewer.Clear ();
        this.navigator.Clear ();
    }

    HidePopups ()
    {
        if (this.dialog !== null) {
            this.dialog.Hide ();
            this.dialog = null;
        }
        this.sidebar.HidePopups ();
    }
    
    OnModelFinished (importResult, threeObject)
    {
        this.model = importResult.model;
        this.viewer.SetMainObject (threeObject);
        this.viewer.SetUpVector (importResult.upVector, false);
        this.navigator.FillTree (importResult);
        this.settingsPanel.Update (this.model);
        this.FitModelToWindow (true);
    }

    OnModelClicked (button, mouseCoordinates)
    {
        if (button === 1) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse (mouseCoordinates);
            if (meshUserData === null) {
                this.navigator.SetSelection (null);
            } else {
                this.navigator.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshUserData.originalMeshId.meshIndex));
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
                        this.navigator.ShowAllMeshes ();
                    }
                });
            }
        } else {
            let meshIndex = meshUserData.originalMeshId.meshIndex;
            items.push ({
                name : 'Hide mesh',
                icon : 'hidden',
                onClick : () => {
                    this.navigator.ToggleMeshVisibility (meshIndex);
                }
            });
            items.push ({
                name : 'Fit mesh to window',
                icon : 'fit',
                onClick : () => {
                    this.navigator.FitMeshToWindow (meshIndex);
                }
            });
            if (this.navigator.MeshCount () > 1) {
                let isMeshIsolated = this.navigator.IsMeshIsolated (meshIndex);
                items.push ({
                    name : isMeshIsolated ? 'Remove isolation' : 'Isolate mesh',
                    icon : isMeshIsolated ? 'deisolate' : 'isolate',
                    onClick : () => {
                        this.navigator.IsolateMesh (meshIndex);
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

    OpenFileBrowserDialog ()
    {
        this.parameters.fileInput.trigger ('click');
    }

    FitModelToWindow (onLoad)
    {
        let animation = !onLoad;
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshId.meshIndex);
        });
        if (onLoad) {
            this.viewer.AdjustClippingPlanesToSphere (boundingSphere);
        }
        this.viewer.FitSphereToWindow (boundingSphere, animation);
    }

    FitMeshToWindow (meshIndex)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return meshUserData.originalMeshId.meshIndex === meshIndex;
        });        
        this.viewer.FitSphereToWindow (boundingSphere, true);
    }

    UpdateMeshesVisibility ()
    {
        this.viewer.SetMeshesVisibility ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshId.meshIndex);
        });
    }

    UpdateMeshesSelection ()
    {
        let selectedMeshIndex = this.navigator.GetSelectedMeshIndex ();
        this.viewer.SetMeshesHighlight (this.highlightMaterial, (meshUserData) => {
            if (meshUserData.originalMeshId.meshIndex === selectedMeshIndex) {
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
            if (this.settings.themeId === OV.Theme.Light) {
                this.settings.backgroundColor = new OV.Color (255, 255, 255);
                this.settings.defaultColor = new OV.Color (200, 200, 200);
            } else if (this.settings.themeId === OV.Theme.Dark) {
                this.settings.backgroundColor = new OV.Color (42, 43, 46);
                this.settings.defaultColor = new OV.Color (200, 200, 200);
            } else {
                return;
            }
            this.settings.SaveToCookies (this.cookieHandler);
            this.viewer.SetBackgroundColor (this.settings.backgroundColor);
            if (this.modelLoader.defaultMaterial !== null) {
                OV.ReplaceDefaultMaterialColor (this.model, this.settings.defaultColor);
                this.modelLoader.ReplaceDefaultMaterialColor (this.settings.defaultColor);
            }            
            if (this.settingsPanel !== null) {
                this.settingsPanel.UpdateSettings (this.settings);
            }
        }
    }

    InitViewer ()
    {
        let canvas = $('<canvas>').appendTo (this.parameters.viewerDiv);
        this.viewer.Init (canvas.get (0));
        this.viewer.SetBackgroundColor (this.settings.backgroundColor);
        this.viewer.SetEnvironmentMap ([
            'assets/envmaps/fishermans_bastion/posx.jpg',
            'assets/envmaps/fishermans_bastion/negx.jpg',
            'assets/envmaps/fishermans_bastion/posy.jpg',
            'assets/envmaps/fishermans_bastion/negy.jpg',
            'assets/envmaps/fishermans_bastion/posz.jpg',
            'assets/envmaps/fishermans_bastion/negz.jpg'
        ]);
        this.SetUIState (OV.WebsiteUIState.Intro);
    }

    InitToolbar ()
    {
        function AddButton (toolbar, eventHandler, imageName, imageTitle, extraClass, onClick)
        {
            let button = toolbar.AddImageButton (imageName, imageTitle, () => {
                eventHandler.HandleEvent ('toolbar_clicked', { item : imageName });
                onClick ();
            });
            if (extraClass !== null) {
                button.AddClass (extraClass);
            }
            return button;
        }

        function AddRadioButton (toolbar, eventHandler, imageNames, imageTitles, selectedIndex, extraClass, onClick)
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
            if (extraClass !== null) {
                for (let i = 0; i < buttons.length; i++) {
                    let button = buttons[i];
                    button.AddClass (extraClass);
                }
            }
        }

        function AddSeparator (toolbar, extraClass)
        {
            let separator = toolbar.AddSeparator ();
            if (extraClass) {
                separator.addClass (extraClass);
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
        AddSeparator (this.toolbar, 'only_on_model');
        AddButton (this.toolbar, this.eventHandler, 'fit', 'Fit model to window', 'only_on_model', () => {
            this.FitModelToWindow (false);
        });
        AddButton (this.toolbar, this.eventHandler, 'up_y', 'Set Y axis as up vector', 'only_on_model', () => {
            this.viewer.SetUpVector (OV.Direction.Y, true);
        });
        AddButton (this.toolbar, this.eventHandler, 'up_z', 'Set Z axis as up vector', 'only_on_model', () => {
            this.viewer.SetUpVector (OV.Direction.Z, true);
        });
        AddButton (this.toolbar, this.eventHandler, 'flip', 'Flip up vector', 'only_on_model', () => {
            this.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar, 'only_on_model');
        AddRadioButton (this.toolbar, this.eventHandler, ['fix_up_on', 'fix_up_off'], ['Fixed up vector', 'Free orbit'], 0, 'only_on_model', (buttonIndex) => {
            if (buttonIndex === 0) {
                this.viewer.SetFixUpVector (true);
            } else if (buttonIndex === 1) {
                this.viewer.SetFixUpVector (false);
            }
        });
        AddSeparator (this.toolbar, 'only_full_width only_on_model');
        AddButton (this.toolbar, this.eventHandler, 'export', 'Export model', 'only_full_width only_on_model', () => {
            let exportDialog = new OV.ExportDialog ({
                onDialog : (dialog) => {
                    this.dialog = dialog;
                }
            });
            exportDialog.Show (this.model, this.viewer);
        });
        AddButton (this.toolbar, this.eventHandler, 'share', 'Share model', 'only_full_width only_on_model', () => {
            this.dialog = OV.ShowSharingDialog (importer, this.settings, this.viewer.GetCamera ());
        });

        this.parameters.fileInput.on ('change', (ev) => {
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
            if (ev.dataTransfer.files.length > 0) {
                this.eventHandler.HandleEvent ('model_load_started', { source : 'drop' });
                this.LoadModelFromFileList (ev.dataTransfer.files);
            }
        }, false);
    }

    InitModelLoader ()
    {
        OV.InitModelLoader (this.modelLoader, {
            onStart : () =>
            {
                this.ClearModel ();
                this.SetUIState (OV.WebsiteUIState.Loading);
            },
            onFinish : (importResult, threeObject) =>
            {
                this.OnModelFinished (importResult, threeObject);
                let importedExtension = OV.GetFileExtension (importResult.mainFile);
                this.eventHandler.HandleEvent ('model_loaded', { extension : importedExtension });
                this.SetUIState (OV.WebsiteUIState.Model);
            },
            onRender : () =>
            {
                this.viewer.Render ();
            },
            onError : (importError) =>
            {
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
                this.SetUIState (OV.WebsiteUIState.Intro);
            }
        });
    }

    InitSidebar ()
    {
        function AddSidebarButton (toolbar, eventHandler, sidebarPanel, onClick)
        {
            let button = toolbar.AddImageButton (sidebarPanel.image, sidebarPanel.title, () => {
                eventHandler.HandleEvent ('sidebar_clicked', { item : sidebarPanel.image });
                onClick ();
            });
            button.AddClass ('only_full_width only_on_model right');
            return button;
        }

        function UpdateSidebarButtons (sidebar, sidebarPanels)
        {
            const visiblePanelId = sidebar.GetVisiblePanelId ();
            for (let i = 0; i < sidebarPanels.length; i++) {
                let sidebarPanel = sidebarPanels[i];
                if (sidebarPanel.panelId === visiblePanelId) {
                    sidebarPanel.button.AddImageClass ('selected');
                } else {
                    sidebarPanel.button.RemoveImageClass ('selected');
                }
            }
        }

        function ShowSidebar (sidebar, cookieHandler, sidebarPanels, panelId)
        {
            sidebar.Show (panelId);
            UpdateSidebarButtons (sidebar, sidebarPanels);
            cookieHandler.SetBoolVal ('ov_show_sidebar', sidebar.IsVisible ());
        }
    
        function ToggleSidebar (sidebar, cookieHandler, sidebarPanels, panelId)
        {
            if (sidebar.GetVisiblePanelId () !== panelId) {
                ShowSidebar (sidebar, cookieHandler, sidebarPanels, panelId);
            } else {
                ShowSidebar (sidebar, cookieHandler, sidebarPanels, null);
            }
        }

        this.detailsPanel = new OV.DetailsSidebarPanel (this.parameters.sidebarDiv);
        this.settingsPanel = new OV.SettingsSidebarPanel (this.parameters.sidebarDiv);

        let sidebarPanels = [
            {
                panelId : null,
                panel : this.detailsPanel,
                image : 'details',
                title : 'Details panel',
                button : null
            },
            {
                panelId : null,
                panel : this.settingsPanel,
                image : 'settings',
                title : 'Settings panel',
                button : null
            }            
        ];

        for (let id = 0; id < sidebarPanels.length; id++) {
            let sidebarPanel = sidebarPanels[id];
            sidebarPanel.panelId = this.sidebar.AddPanel (sidebarPanel.panel);
            sidebarPanel.button = AddSidebarButton (this.toolbar, this.eventHandler, sidebarPanel, () => {
                ToggleSidebar (this.sidebar, this.cookieHandler, sidebarPanels, sidebarPanel.panelId);
                this.Resize ();
            });
            sidebarPanel.panel.Init ({
                onClose : () => {
                    ShowSidebar (this.sidebar, this.cookieHandler, sidebarPanels, null);
                    this.Resize ();
                }
            });
        }

        let defaultSettings = new OV.Settings ();
        this.settingsPanel.InitSettings (
            this.settings,
            defaultSettings,
            {
                onBackgroundColorChange : (newVal) => {
                    this.settings.backgroundColor = newVal;
                    this.settings.SaveToCookies (this.cookieHandler);
                    this.viewer.SetBackgroundColor (newVal);
                },
                onDefaultColorChange : (newVal) => {
                    this.settings.defaultColor = newVal;
                    this.settings.SaveToCookies (this.cookieHandler);
                    if (this.modelLoader.defaultMaterial !== null) {
                        OV.ReplaceDefaultMaterialColor (this.model, newVal);
                        this.modelLoader.ReplaceDefaultMaterialColor (newVal);
                    }
                    this.viewer.Render ();
                },
                onThemeChange : (newVal) => {
                    this.SwitchTheme (newVal, true);
                }
            }
        );

        let show = this.cookieHandler.GetBoolVal ('ov_show_sidebar', true);
        ShowSidebar (this.sidebar, this.cookieHandler, sidebarPanels, show ? sidebarPanels[0].panelId : null);
    }

    InitNavigator ()
    {
        function GetMeshUserData (viewer, meshIndex)
        {
            let userData = null;
            viewer.EnumerateMeshesUserData ((meshUserData) => {
                if (meshUserData.originalMeshId.meshIndex === meshIndex) {
                    userData = meshUserData;
                }
            });
            return userData;
        }

        function GetMeshesForMaterial (viewer, model, materialIndex)
        {
            let usedByMeshes = [];
            viewer.EnumerateMeshesUserData ((meshUserData) => {
                if (meshUserData.originalMaterials.indexOf (materialIndex) !== -1) {
                    const mesh = model.GetMesh (meshUserData.originalMeshId.meshIndex);
                    usedByMeshes.push ({
                        index : meshUserData.originalMeshId.meshIndex,
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

        function GetMaterialsForMesh (viewer, model, meshIndex)
        {
            let usedMaterials = [];
            let userData = GetMeshUserData (viewer, meshIndex);
            for (let i = 0; i < userData.originalMaterials.length; i++) {
                const materialIndex = userData.originalMaterials[i];
                usedMaterials.push (GetMaterialReferenceInfo (model, materialIndex));                
            }
            usedMaterials.sort ((a, b) => {
                return a.index - b.index;
            });            
            return usedMaterials;
        }
    
        function GetMaterialsForModel (model)
        {
            let usedMaterials = [];
            for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
                usedMaterials.push (GetMaterialReferenceInfo (model, materialIndex));
            }
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
            fitMeshToWindow : (meshIndex) => {
                this.FitMeshToWindow (meshIndex);
            },
            getMeshesForMaterial : (materialIndex) => {
                return GetMeshesForMaterial (this.viewer, this.model, materialIndex);
            },
            getMaterialsForMesh : (meshIndex) => {
                return GetMaterialsForMesh (this.viewer, this.model, meshIndex);
            },
            getMaterialsForModel : () => {
                return GetMaterialsForModel (this.model);
            },
            onModelSelected : () => {
                this.detailsPanel.AddObject3DProperties (this.model);
            },
            onMeshSelected : (meshIndex) => {
                this.detailsPanel.AddObject3DProperties (this.model.GetMesh (meshIndex));
            },
            onMaterialSelected : (materialIndex) => {
                this.detailsPanel.AddMaterialProperties (this.model.GetMaterial (materialIndex));
            }
        });
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
