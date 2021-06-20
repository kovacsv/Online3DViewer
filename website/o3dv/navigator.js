OV.SelectionType =
{
    Material : 1,
    Mesh : 2
};

OV.Selection = class
{
    constructor (type, index)
    {
        this.type = type;
        this.index = index;
    }
};

OV.NavigatorInfoPanel = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.popup = null;
    }

    FillWithMaterialInfo (usedByMeshes, callbacks)
    {
        this.Clear ();
        if (usedByMeshes === null) {
            return;
        }

        let meshItems = [];
        for (let i = 0; i < usedByMeshes.length; i++) {
            let meshInfo = usedByMeshes[i];
            meshItems.push ({
                name : OV.GetMeshName (meshInfo.name)
            });
        }

        let obj = this;
        let meshesText = 'Meshes (' + meshItems.length + ')';
        this.CreateButton (this.parentDiv, meshesText, function (button) {
            if (meshItems.length === 0) {
                return;
            }
            obj.popup = OV.ShowListPopup (button, meshItems, {
                onHoverStart : function (index) {
                    const meshItem = usedByMeshes[index];
                    callbacks.onMeshHover (meshItem.index);
                },
                onHoverStop : function (index) {
                    callbacks.onMeshHover (null);
                },
                onClick : function (index) {
                    const meshItem = usedByMeshes[index];
                    callbacks.onMeshSelect (meshItem.index);
                }
            });
        });
    }

    FillWithModelInfo (usedMaterials, callbacks)
    {
        this.Clear ();
        if (usedMaterials === null) {
            return;
        }

        let materialItems = [];
        for (let i = 0; i < usedMaterials.length; i++) {
            let usedMaterial = usedMaterials[i];
            materialItems.push ({
                name : OV.GetMaterialName (usedMaterial.name),
                color : OV.ColorToHexString (usedMaterial.diffuse)
            });
        }

        let obj = this;
        let materialsText = 'Materials (' + materialItems.length + ')';
        this.CreateButton (this.parentDiv, materialsText, function (button) {
            obj.popup = OV.ShowListPopup (button, materialItems, {
                onClick : function (index) {
                    let usedMaterial = usedMaterials[index];
                    callbacks.onMaterialSelect (usedMaterial.index);
                }
            });
        });        
    }

    CreateButton (parentDiv, buttonText, onClick)
    {
        let button = $('<div>').addClass ('ov_navigator_info_button').appendTo (parentDiv);
        $('<div>').addClass ('ov_navigator_info_button_text').html (buttonText).appendTo (button);
        $('<img>').addClass ('ov_navigator_info_button_icon').attr ('src', 'assets/images/tree/arrow_right.svg').appendTo (button);
        button.click (function () {
            onClick (button);
        });
    }

    Clear ()
    {
        if (this.popup !== null) {
            this.popup.Hide ();
            this.popup = null;
        }        
        this.parentDiv.empty ();
    }
};

OV.Navigator = class
{
    constructor (parentDiv, sidebar)
    {
        this.parentDiv = parentDiv;
        this.sidebar = sidebar;
        this.callbacks = null;
        this.titleDiv = $('<div>').addClass ('ov_navigator_tree_title').appendTo (parentDiv);
        this.treeDiv = $('<div>').addClass ('ov_navigator_tree_panel').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
        this.infoDiv = $('<div>').addClass ('ov_navigator_info_panel').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
        this.treeView = new OV.TreeView (this.treeDiv);
        this.infoPanel = new OV.NavigatorInfoPanel (this.infoDiv);
        this.modelData = new OV.ModelData ();
        this.selection = null;
        this.tempSelectedMeshIndex = null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let infoHeight = this.infoDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - infoHeight - titleHeight, true);
    }

    FillTree (importResult)
    {
        let obj = this;

        this.titleDiv.html (importResult.mainFile).attr ('title', importResult.mainFile);

        let model = importResult.model;
        let usedFiles = importResult.usedFiles;
        let missingFiles = importResult.missingFiles;

        let filesItem = new OV.TreeViewGroupItem ('Files', 'assets/images/tree/files.svg');
        this.treeView.AddItem (filesItem);
        for (let i = 0; i < usedFiles.length; i++) {
            let file = usedFiles[i];
            let item = new OV.TreeViewSingleItem (file);
            filesItem.AddChild (item);
        }

        if (missingFiles.length > 0) {
            let missingFilesItem = new OV.TreeViewGroupItem ('Missing Files', 'assets/images/tree/missing_files.svg');
            this.treeView.AddItem (missingFilesItem);
            for (let i = 0; i < missingFiles.length; i++) {
                let file = missingFiles[i];
                let item = new OV.TreeViewButtonItem (file);
                let browseButton = new OV.TreeViewButton ('assets/images/tree/open.svg');
                browseButton.OnClick (function () {
                    obj.callbacks.openFileBrowserDialog ();
                });
                item.AddButton (browseButton);
                missingFilesItem.AddChild (item);
            }
        }

        let materialsItem = new OV.TreeViewGroupItem ('Materials', 'assets/images/tree/materials.svg');
        this.treeView.AddItem (materialsItem);
        for (let i = 0; i < model.MaterialCount (); i++) {
            let material = model.GetMaterial (i);
            let materialName = OV.GetMaterialName (material.name);
            let materialData = new OV.MaterialData (i);
            let materialItem = materialData.CreateMenuItem (materialName, {
                onSelected : function (materialIndex) {
                    obj.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                }
            });
            this.modelData.AddMaterialData (materialData);
            materialsItem.AddChild (materialItem);
        }

        let meshesItem = new OV.TreeViewGroupItem ('Meshes', 'assets/images/tree/meshes.svg');
        this.treeView.AddItem (meshesItem);
        meshesItem.ShowChildren (true, null);
        for (let i = 0; i < model.MeshCount (); i++) {
            let mesh = model.GetMesh (i);
            let meshData = new OV.MeshData (i);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshItem = meshData.CreateMenuItem (meshName, {
                onShowHide : function (meshIndex) {
                    obj.ToggleMeshVisibility (meshIndex);
                },
                onIsolate : function (meshIndex) {
                    obj.IsolateMesh (meshIndex);
                },                
                onFitToWindow : function (meshIndex) {
                    obj.FitMeshToWindow (meshIndex);
                },
                onSelected : function (meshIndex) {
                    obj.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshIndex));
                }
            });
            this.modelData.AddMeshData (meshData);
            meshesItem.AddChild (meshItem);
        }

        this.UpdateInfoPanel ();
        this.Resize ();
    }
    
    IsMeshVisible (meshIndex)
    {
        let meshData = this.modelData.GetMeshData (meshIndex);
        return meshData.IsVisible ();
    }

    IsolateMesh (meshIndex)
    {
        let isIsolated = true;
        for (let i = 0; i < this.modelData.MeshCount (); i++) {
            let meshData = this.modelData.GetMeshData (i);
            if (i !== meshIndex && meshData.IsVisible ()) {
                isIsolated = false;
                break;
            }
        }
        for (let i = 0; i < this.modelData.MeshCount (); i++) {
            let meshData = this.modelData.GetMeshData (i);
            if (i === meshIndex || isIsolated) {
                meshData.SetVisible (true);
            } else {
                meshData.SetVisible (false);
            }
        }
        this.callbacks.updateMeshesVisibility ();
    }

    ToggleMeshVisibility (meshIndex)
    {
        let meshData = this.modelData.GetMeshData (meshIndex);
        meshData.SetVisible (!meshData.IsVisible ());
        this.callbacks.updateMeshesVisibility ();
    }

    GetSelectedMeshIndex ()
    {
        if (this.tempSelectedMeshIndex !== null) {
            return this.tempSelectedMeshIndex;
        }
        if (this.selection === null || this.selection.type !== OV.SelectionType.Mesh) {
            return -1;
        }
        return this.selection.index;
    }

    SetTempSelectedMeshIndex (tempSelectedMeshIndex)
    {
        this.tempSelectedMeshIndex = tempSelectedMeshIndex;
        this.callbacks.updateMeshesSelection ();
    }

    SetSelection (selection)
    {
        function SetEntitySelection (obj, selection, select)
        {
            if (selection.type === OV.SelectionType.Material) {
                obj.modelData.GetMaterialData (selection.index).SetSelected (select);
            } else if (selection.type === OV.SelectionType.Mesh) {
                obj.modelData.GetMeshData (selection.index).SetSelected (select);
            }           
        }

        function SetCurrentSelection (obj, selection)
        {
            obj.selection = selection;
            obj.UpdateInfoPanel ();
        }

        let oldSelection = this.selection;
        if (oldSelection !== null) {
            SetEntitySelection (this, oldSelection, false);
        }

        SetCurrentSelection (this, selection);
        this.tempSelectedMeshIndex = null;

        if (this.selection !== null) {
            if (oldSelection !== null && this.selection.type === oldSelection.type && this.selection.index === oldSelection.index) {
                SetEntitySelection (this, this.selection, false);
                SetCurrentSelection (this, null);
            } else {
                SetEntitySelection (this, this.selection, true);
            }
        }

        this.callbacks.updateMeshesSelection ();
    }

    FitMeshToWindow (meshIndex)
    {
        this.callbacks.fitMeshToWindow (meshIndex);
    }

    UpdateInfoPanel ()
    {
        let obj = this;
        if (this.selection === null) {
            let usedMaterials = this.callbacks.getMaterialsForModel ();
            this.sidebar.AddProperties (null);
            this.infoPanel.FillWithModelInfo (usedMaterials, {
                onMaterialSelect : function (materialIndex) {
                    obj.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                }
            });
        } else {
            if (this.selection.type === OV.SelectionType.Material) {
                let usedByMeshes = this.callbacks.getMeshesForMaterial (this.selection.index);
                this.sidebar.AddProperties (null);
                this.infoPanel.FillWithMaterialInfo (usedByMeshes, {
                    onMeshHover : function (meshIndex) {
                        obj.SetTempSelectedMeshIndex (meshIndex);
                    },
                    onMeshSelect : function (meshIndex) {
                        obj.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshIndex));
                    }
                });
            } else if (this.selection.type === OV.SelectionType.Mesh) {
                let usedMaterials = this.callbacks.getMaterialsForMesh (this.selection.index);
                this.sidebar.AddProperties (null);
                this.infoPanel.FillWithModelInfo (usedMaterials, {
                    onMaterialSelect : function (materialIndex) {
                        obj.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                    }
                });
            }
        }
        this.Resize ();
    }
    
    Clear ()
    {
        this.titleDiv.empty ();
        this.treeView.Clear ();
        this.infoPanel.Clear ();
        this.modelData.Clear ();
        this.selection = null;
    }
};
