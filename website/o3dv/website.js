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
        this.viewerSettings = new OV.ViewerSettings ();
        this.importSettings = new OV.ImportSettings ();
        this.modelLoader = new OV.ThreeModelLoader ();
        this.highlightMaterial = new THREE.MeshPhongMaterial ({
            color : 0x8ec9f0,
            side : THREE.DoubleSide
        });
        this.detailsPanel = null;
        this.model = null;
        this.dialog = null;
    }

    Load ()
    {
        this.InitSettings ();
        this.InitViewer ();
        this.InitToolbar ();
        this.InitDragAndDrop ();
        this.InitModelLoader ();
        this.InitSidebar ();
        this.InitNavigator ();
        this.InitCookieConsent ();

        this.viewer.SetClickHandler (this.OnModelClicked.bind (this));
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

    ShowViewer (show)
    {
        if (show) {
            this.parameters.mainDiv.show ();
        } else {
            this.parameters.mainDiv.hide ();
        }
    }

    ClearModel ()
    {
        if (this.dialog !== null) {
            this.dialog.Hide ();
            this.dialog = null;
        }
        this.model = null;
        this.parameters.introDiv.hide ();
        this.ShowViewer (false);
        this.viewer.Clear ();
        this.navigator.Clear ();
    }
    
    OnModelFinished (importResult, threeMeshes)
    {
        this.model = importResult.model;
        this.ShowViewer (true);
        this.viewer.AddMeshes (threeMeshes);
        this.viewer.SetUpVector (importResult.upVector, false);
        this.navigator.FillTree (importResult);
        this.FitModelToWindow (true);
    }

    OnModelClicked (button, isCtrlPressed, mouseCoordinates)
    {
        if (button === 1) {
            let meshUserData = this.viewer.GetMeshUserDataUnderMouse (mouseCoordinates);
            if (meshUserData === null) {
                this.navigator.SetSelection (null);
            } else {
                if (isCtrlPressed) {
                    this.navigator.IsolateMesh (meshUserData.originalMeshIndex);
                } else {
                    this.navigator.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshUserData.originalMeshIndex));
                }
            }
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
            return this.navigator.IsMeshVisible (meshUserData.originalMeshIndex);
        });
        if (onLoad) {
            this.viewer.AdjustClippingPlanes (boundingSphere);
        }
        this.viewer.FitToWindow (boundingSphere, animation);
    }

    FitMeshToWindow (meshIndex)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return meshUserData.originalMeshIndex === meshIndex;
        });        
        this.viewer.FitToWindow (boundingSphere, true);
    }

    UpdateMeshesVisibility ()
    {
        this.viewer.SetMeshesVisibility ((meshUserData) => {
            return this.navigator.IsMeshVisible (meshUserData.originalMeshIndex);
        });
    }

    UpdateMeshesSelection ()
    {
        let selectedMeshIndex = this.navigator.GetSelectedMeshIndex ();
        this.viewer.SetMeshesHighlight (this.highlightMaterial, (meshUserData) => {
            if (meshUserData.originalMeshIndex === selectedMeshIndex) {
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
        this.modelLoader.LoadFromFileList (files, this.importSettings);
        this.ClearHashIfNotOnlyUrlList ();
    }

    ReloadFiles ()
    {
        if (this.model === null) {
            return;
        }
        this.modelLoader.ReloadFiles (this.importSettings);
    }

    ClearHashIfNotOnlyUrlList ()
    {
        let importer = this.modelLoader.GetImporter ();
        let isOnlyUrl = importer.IsOnlyFileSource (OV.FileSource.Url);
        if (!isOnlyUrl && this.hashHandler.HasHash ()) {
            this.hashHandler.SkipNextEventHandler ();
            this.hashHandler.ClearHash ();
        }
    }

    OnHashChange ()
    {
        if (this.hashHandler.HasHash ()) {
            let urls = this.hashHandler.GetModelFilesFromHash ();
            if (urls === null) {
                return;
            }
            let importSettings = new OV.ImportSettings ();
            importSettings.defaultColor = this.importSettings.defaultColor;
            let defaultColor = this.hashHandler.GetDefaultColorFromHash ();
            if (defaultColor !== null) {
                importSettings.defaultColor = defaultColor;
            }
            this.LoadModelFromUrlList (urls, importSettings);
        } else {
            this.ClearModel ();
            this.parameters.introDiv.show ();
        }
    }

    InitSettings ()
    {
        this.viewerSettings.backgroundColor = this.cookieHandler.GetColorVal ('ov_background_color', new OV.Color (255, 255, 255));
        this.importSettings.defaultColor = this.cookieHandler.GetColorVal ('ov_default_color', new OV.Color (200, 200, 200));
    }

    InitViewer ()
    {
        let canvas = $('<canvas>').appendTo (this.parameters.viewerDiv);
        this.viewer.Init (canvas.get (0));
        this.viewer.SetBackgroundColor (this.viewerSettings.backgroundColor);
        this.ShowViewer (false);
    }

    InitToolbar ()
    {
        function AddButton (toolbar, imageName, imageTitle, onlyFullWidth, onClick)
        {
            let image = 'assets/images/toolbar/' + imageName + '.svg';
            let button = toolbar.AddImageButton (image, imageTitle, onClick);
            if (onlyFullWidth) {
                button.AddClass ('only_full_width');
            }
            return button;
        }

        function AddRadioButton (toolbar, imageNames, imageTitles, selectedIndex, onlyFullWidth, onClick)
        {
            let imageData = [];
            for (let i = 0; i < imageNames.length; i++) {
                let imageName = imageNames[i];
                let imageTitle = imageTitles[i];
                imageData.push ({
                    image : 'assets/images/toolbar/' + imageName + '.svg',
                    title : imageTitle
                });
            }
            let buttons = toolbar.AddImageRadioButton (imageData, selectedIndex, onClick);
            if (onlyFullWidth) {
                for (let i = 0; i < buttons.length; i++) {
                    let button = buttons[i];
                    button.AddClass ('only_full_width');
                }
            }
        }

        function AddSeparator (toolbar, onlyFullWidth)
        {
            let separator = toolbar.AddSeparator ();
            if (onlyFullWidth) {
                separator.addClass ('only_full_width');
            }
        }

        let importer = this.modelLoader.GetImporter ();

        AddButton (this.toolbar, 'open', 'Open model from your device', false, () => {
            this.OpenFileBrowserDialog ();
        });
        AddButton (this.toolbar, 'open_url', 'Open model from a url', false, () => {
            this.dialog = OV.ShowOpenUrlDialog ((urls) => {
                if (urls.length > 0) {
                    this.hashHandler.SetModelFilesToHash (urls);
                }
            });
        });
        AddSeparator (this.toolbar);
        AddButton (this.toolbar, 'fit', 'Fit model to window', false, () => {
            this.FitModelToWindow (false);
        });
        AddButton (this.toolbar, 'up_y', 'Set Y axis as up vector', false, () => {
            this.viewer.SetUpVector (OV.Direction.Y, true);
        });
        AddButton (this.toolbar, 'up_z', 'Set Z axis as up vector', false, () => {
            this.viewer.SetUpVector (OV.Direction.Z, true);
        });
        AddButton (this.toolbar, 'flip', 'Flip up vector', false, () => {
            this.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar);
        AddRadioButton (this.toolbar, ['fix_up_on', 'fix_up_off'], ['Fixed up vector', 'Free orbit'], 0, false, (buttonIndex) => {
            if (buttonIndex === 0) {
                this.viewer.SetFixUpVector (true);
            } else if (buttonIndex === 1) {
                this.viewer.SetFixUpVector (false);
            }
        });
        AddSeparator (this.toolbar, true);
        AddButton (this.toolbar, 'export', 'Export model', true, () => {
            let exportDialog = new OV.ExportDialog ({
                onDialog : (dialog) => {
                    this.dialog = dialog;
                }
            });
            exportDialog.Show (this.model, this.viewer);
        });
        AddButton (this.toolbar, 'share', 'Share model', true, () => {
            this.dialog = OV.ShowSharingDialog (importer, this.viewerSettings, this.importSettings, this.viewer.GetCamera ());
        });

        this.parameters.fileInput.on ('change', (ev) => {
            if (ev.target.files.length > 0) {
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
            },
            onFinish : (importResult, threeMeshes) =>
            {
                this.OnModelFinished (importResult, threeMeshes);
            },
            onRender : () =>
            {
                this.viewer.Render ();
            }
        });
    }

    InitSidebar ()
    {
        function AddSidebarButton (toolbar, sidebarPanel, onClick)
        {
            let image = 'assets/images/toolbar/' + sidebarPanel.image + '.svg';
            let button = toolbar.AddImageButton (image, sidebarPanel.title, onClick);
            button.AddClass ('only_full_width');
            button.AddClass ('right');
            return button;
        }

        function UpdateSidebarButtons (sidebar, sidebarPanels)
        {
            const visiblePanelId = sidebar.GetVisiblePanelId ();
            for (let i = 0; i < sidebarPanels.length; i++) {
                let sidebarPanel = sidebarPanels[i];
                if (sidebarPanel.panelId === visiblePanelId) {
                    let image = 'assets/images/toolbar/' + sidebarPanel.image + '_active.svg';
                    sidebarPanel.button.SetImage (image);
                } else {
                    let image = 'assets/images/toolbar/' + sidebarPanel.image + '.svg';
                    sidebarPanel.button.SetImage (image);
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
        let settingsPanel = new OV.SettingsSidebarPanel (this.parameters.sidebarDiv);

        let sidebarPanels = [
            {
                panelId : null,
                panel : this.detailsPanel,
                image : 'details',
                title : 'Details panel',
                button : null
            }
        ];
        if (OV.FeatureSet.SettingsPanel) {
            sidebarPanels.push (
                {
                    panelId : null,
                    panel : settingsPanel,
                    image : 'settings',
                    title : 'Settings panel',
                    button : null
                }
            );
        }

        for (let id = 0; id < sidebarPanels.length; id++) {
            let sidebarPanel = sidebarPanels[id];
            sidebarPanel.panelId = this.sidebar.AddPanel (sidebarPanel.panel);
            sidebarPanel.button = AddSidebarButton (this.toolbar, sidebarPanel, () => {
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

        settingsPanel.InitSettings ({
            backgroundColor : {
                defaultValue : this.viewerSettings.backgroundColor,
                onChange : (newVal) => {
                    this.viewerSettings.backgroundColor = newVal;
                    this.viewer.SetBackgroundColor (newVal);
                    this.cookieHandler.SetColorVal ('ov_background_color', newVal);
                }
            },
            defaultColor : {
                defaultValue : this.importSettings.defaultColor,
                onChange : (newVal) => {
                    this.importSettings.defaultColor = newVal;
                    this.cookieHandler.SetColorVal ('ov_default_color', newVal);
                    if (this.modelLoader.defaultMaterial !== null) {
                        OV.ReplaceDefaultMaterialColor (this.model, newVal);
                        this.modelLoader.defaultMaterial.color = new THREE.Color (newVal.r / 255.0, newVal.g / 255.0, newVal.b / 255.0);
                    }
                    this.viewer.Render ();
                }
            }
        });

        let show = this.cookieHandler.GetBoolVal ('ov_show_sidebar', true);
        ShowSidebar (this.sidebar, this.cookieHandler, sidebarPanels, show ? sidebarPanels[0].panelId : null);
    }

    InitNavigator ()
    {
        function GetMeshUserData (viewer, meshIndex)
        {
            let userData = null;
            viewer.EnumerateMeshesUserData ((meshUserData) => {
                if (meshUserData.originalMeshIndex === meshIndex) {
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
                    const mesh = model.GetMesh (meshUserData.originalMeshIndex);
                    usedByMeshes.push ({
                        index : meshUserData.originalMeshIndex,
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
                diffuse : material.diffuse.Clone ()
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
                this.detailsPanel.AddElementProperties (this.model);
            },
            onMeshSelected : (meshIndex) => {
                this.detailsPanel.AddElementProperties (this.model.GetMesh (meshIndex));
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
