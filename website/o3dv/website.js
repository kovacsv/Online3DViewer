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
        this.navigator = new OV.Navigator (this.parameters.navigatorDiv, this.sidebar);
        this.importSettings = new OV.ImportSettings ();
        this.modelLoader = new OV.ThreeModelLoader ();
        this.highlightMaterial = new THREE.MeshPhongMaterial ({
            color : 0x8ec9f0,
            side : THREE.DoubleSide
        });
        this.model = null;
        this.dialog = null;
    }

    Load ()
    {
        let canvas = $('<canvas>').appendTo (this.parameters.viewerDiv);
        this.viewer.Init (canvas.get (0));
        this.ShowViewer (false);
        this.hashHandler.SetEventListener (this.OnHashChange.bind (this));

        this.InitToolbar ();
        this.InitDragAndDrop ();
        this.InitModelLoader ();
        this.InitSidebar ();
        this.InitNavigator ();
        this.InitCookieConsent ();

        this.viewer.SetClickHandler (this.OnModelClicked.bind (this));
        this.Resize ();

        this.OnHashChange ();

        let obj = this;
        $(window).on ('resize', function () {
			obj.Resize ();
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

    ShowSidebar (show)
    {
        this.sidebar.Show (show);
        this.cookieHandler.SetBoolVal ('ov_show_sidebar', show);
        this.Resize ();
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
        let obj = this;
        let animation = !onLoad;
        let boundingSphere = this.viewer.GetBoundingSphere (function (meshUserData) {
            return obj.navigator.IsMeshVisible (meshUserData.originalMeshIndex);
        });
        if (onLoad) {
            this.viewer.AdjustClippingPlanes (boundingSphere);
        }
        this.viewer.FitToWindow (boundingSphere, animation);
    }

    FitMeshToWindow (meshIndex)
    {
        let boundingSphere = this.viewer.GetBoundingSphere (function (meshUserData) {
            return meshUserData.originalMeshIndex === meshIndex;
        });        
        this.viewer.FitToWindow (boundingSphere, true);
    }

    UpdateMeshesVisibility ()
    {
        let obj = this;
        this.viewer.SetMeshesVisibility (function (meshUserData) {
            return obj.navigator.IsMeshVisible (meshUserData.originalMeshIndex);
        });
    }

    UpdateMeshesSelection ()
    {
        let selectedMeshIndex = this.navigator.GetSelectedMeshIndex ();
        this.viewer.SetMeshesHighlight (this.highlightMaterial, function (meshUserData) {
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
            let settings = new OV.ImportSettings ();
            settings.defaultColor = this.importSettings.defaultColor;
            let color = this.hashHandler.GetColorFromHash ();
            if (color !== null) {
                settings.defaultColor = color;
            }
            this.LoadModelFromUrlList (urls, settings);
        } else {
            this.ClearModel ();
            this.parameters.introDiv.show ();
        }
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

        function AddRightButton (toolbar, imageName, imageTitle, onlyFullWidth, onClick)
        {
            let button = AddButton (toolbar, imageName, imageTitle, onlyFullWidth, onClick);
            button.AddClass ('right');
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

        let obj = this;
        let importer = this.modelLoader.GetImporter ();

        AddButton (this.toolbar, 'open', 'Open model from your device', false, function () {
            obj.OpenFileBrowserDialog ();
        });
        AddButton (this.toolbar, 'open_url', 'Open model from a url', false, function () {
            obj.dialog = OV.ShowOpenUrlDialog (function (urls) {
                if (urls.length > 0) {
                    obj.hashHandler.SetModelFilesToHash (urls);
                }
            });
        });
        AddSeparator (this.toolbar);
        AddButton (this.toolbar, 'fit', 'Fit model to Window', false, function () {
            obj.FitModelToWindow (false);
        });
        AddButton (this.toolbar, 'up_y', 'Set Y axis as up vector', false, function () {
            obj.viewer.SetUpVector (OV.Direction.Y, true);
        });
        AddButton (this.toolbar, 'up_z', 'Set Z axis as up vector', false, function () {
            obj.viewer.SetUpVector (OV.Direction.Z, true);
        });
        AddButton (this.toolbar, 'flip', 'Flip up vector', false, function () {
            obj.viewer.FlipUpVector ();
        });
        AddSeparator (this.toolbar);
        AddRadioButton (this.toolbar, ['fix_up_on', 'fix_up_off'], ['Fixed up vector', 'Free orbit'], 0, false, function (buttonIndex) {
            if (buttonIndex === 0) {
                obj.viewer.SetFixUpVector (true);
            } else if (buttonIndex === 1) {
                obj.viewer.SetFixUpVector (false);
            }
        });
        AddSeparator (this.toolbar, true);
        AddButton (this.toolbar, 'export', 'Export model', true, function () {
            let exportDialog = new OV.ExportDialog ({
                onDialog : function (dialog) {
                    obj.dialog = dialog;
                }
            });
            exportDialog.Show (obj.model, obj.viewer);
        });
        AddButton (this.toolbar, 'share', 'Share model', true, function () {
            obj.dialog = OV.ShowSharingDialog (importer, obj.importSettings, obj.viewer.GetCamera ());
        });
        if (OV.FeatureSet.SetDefaultColor) {
            AddSeparator (this.toolbar, true);
            AddButton (this.toolbar, 'settings', 'Settings', true, function () {
                obj.dialog = OV.ShowSettingsDialog (obj.importSettings, function (dialogSettings) {
                    let reload = false;
                    if (!OV.ColorIsEqual (obj.importSettings.defaultColor, dialogSettings.defaultColor)) {
                        obj.importSettings.defaultColor = dialogSettings.defaultColor;
                        reload = true;
                    }
                    if (reload) {
                        obj.ReloadFiles ();
                    }
                });
            });
        }
        AddRightButton (this.toolbar, 'details', 'Details Panel', true, function () {
            obj.ShowSidebar (!obj.sidebar.IsVisible ());
        });
        
        this.parameters.fileInput.on ('change', function (ev) {
            if (ev.target.files.length > 0) {
                obj.LoadModelFromFileList (ev.target.files);
            }
        });
    }

    InitDragAndDrop ()
    {
        window.addEventListener ('dragstart', function (ev) {
            ev.preventDefault ();
        }, false);

        window.addEventListener ('dragover', function (ev) {
            ev.stopPropagation ();
            ev.preventDefault ();
            ev.dataTransfer.dropEffect = 'copy';
        }, false);

        let obj = this;
        window.addEventListener ('drop', function (ev) {
            ev.stopPropagation ();
            ev.preventDefault ();
            if (ev.dataTransfer.files.length > 0) {
                obj.LoadModelFromFileList (ev.dataTransfer.files);
            }
        }, false);
    }

    InitModelLoader ()
    {
        let obj = this;
        OV.InitModelLoader (this.modelLoader, {
            onStart : function ()
            {
                obj.ClearModel ();
            },
            onFinish : function (importResult, threeMeshes)
            {
                obj.OnModelFinished (importResult, threeMeshes);
            },
            onRender : function ()
            {
                obj.viewer.Render ();
            }
        });
    }

    InitSidebar ()
    {
        let show = this.cookieHandler.GetBoolVal ('ov_show_sidebar', true);
        this.ShowSidebar (show);
    }

    InitNavigator ()
    {
        function GetMeshUserData (viewer, meshIndex)
        {
            let userData = null;
            viewer.EnumerateMeshesUserData (function (meshUserData) {
                if (meshUserData.originalMeshIndex === meshIndex) {
                    userData = meshUserData;
                }
            });
            return userData;
        }

        function GetMeshesForMaterial (viewer, model, materialIndex)
        {
            let usedByMeshes = [];
            viewer.EnumerateMeshesUserData (function (meshUserData) {
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
            usedMaterials.sort (function (a, b) {
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

        let obj = this;
        this.navigator.Init ({
            openFileBrowserDialog : function () {
                obj.OpenFileBrowserDialog ();
            },
            updateMeshesVisibility : function () {
                obj.UpdateMeshesVisibility ();
            },
            updateMeshesSelection : function () {
                obj.UpdateMeshesSelection ();
            },
            fitMeshToWindow : function (meshIndex) {
                obj.FitMeshToWindow (meshIndex);
            },
            getMeshesForMaterial : function (materialIndex) {
                return GetMeshesForMaterial (obj.viewer, obj.model, materialIndex);
            },
            getMaterialsForMesh : function (meshIndex) {
                return GetMaterialsForMesh (obj.viewer, obj.model, meshIndex);
            },
            getMaterialsForModel : function () {
                return GetMaterialsForModel (obj.model);
            }
        });
    }

    InitCookieConsent ()
    {
        let accepted = this.cookieHandler.GetBoolVal ('ov_cookie_consent', false);
        if (accepted) {
            return;
        }

        let obj = this;
        OV.ShowCookieDialog (function () {
            obj.cookieHandler.SetBoolVal ('ov_cookie_consent', true);
        });
    }
};
