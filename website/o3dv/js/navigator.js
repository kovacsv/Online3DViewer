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

        let meshesText = 'Meshes (' + meshItems.length + ')';
        this.CreateButton (this.parentDiv, meshesText, (button) => {
            if (meshItems.length === 0) {
                return;
            }
            this.popup = OV.ShowListPopup (meshItems, {
                calculatePosition : (contentDiv) => {
                    return OV.CalculatePopupPositionToElementBottomRight (button, contentDiv);
                },
                onHoverStart : (index) => {
                    const meshItem = usedByMeshes[index];
                    callbacks.onMeshHover (meshItem.index);
                },
                onHoverStop : (index) => {
                    callbacks.onMeshHover (null);
                },
                onClick : (index) => {
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
                color : usedMaterial.color
            });
        }

        let materialsText = 'Materials (' + materialItems.length + ')';
        this.CreateButton (this.parentDiv, materialsText, (button) => {
            this.popup = OV.ShowListPopup (materialItems, {
                calculatePosition : (contentDiv) => {
                    return OV.CalculatePopupPositionToElementBottomRight (button, contentDiv);
                },
                onClick : (index) => {
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
        OV.CreateSvgIcon (button, 'arrow_right', 'ov_navigator_info_button_icon');
        button.click (() => {
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
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.callbacks = null;
        this.titleDiv = $('<div>').addClass ('ov_navigator_tree_title').appendTo (parentDiv);
        this.treeDiv = $('<div>').addClass ('ov_navigator_tree_panel').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
        this.infoDiv = $('<div>').addClass ('ov_navigator_info_panel').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
        this.treeView = new OV.TreeView (this.treeDiv);
        this.infoPanel = new OV.NavigatorInfoPanel (this.infoDiv);
        this.navigatorItems = new OV.NavigatorItems ();
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
        const model = importResult.model;
        const mainFile = importResult.mainFile;
        const usedFiles = importResult.usedFiles;
        const missingFiles = importResult.missingFiles;

        this.titleDiv.html (mainFile).attr ('title', mainFile);

        let filesItem = new OV.TreeViewGroupItem ('Files', 'files');
        this.treeView.AddItem (filesItem);
        for (let i = 0; i < usedFiles.length; i++) {
            let file = usedFiles[i];
            let item = new OV.TreeViewSingleItem (file);
            filesItem.AddChild (item);
        }

        if (missingFiles.length > 0) {
            let missingFilesItem = new OV.TreeViewGroupItem ('Missing Files', 'missing_files');
            this.treeView.AddItem (missingFilesItem);
            for (let i = 0; i < missingFiles.length; i++) {
                let file = missingFiles[i];
                let item = new OV.TreeViewButtonItem (file);
                let browseButton = new OV.TreeViewButton ('open');
                browseButton.OnClick (() => {
                    this.callbacks.openFileBrowserDialog ();
                });
                item.AddButton (browseButton);
                missingFilesItem.AddChild (item);
            }
        }

        let materialsItem = new OV.TreeViewGroupItem ('Materials', 'materials');
        this.treeView.AddItem (materialsItem);
        for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
            let material = model.GetMaterial (materialIndex);
            let materialName = OV.GetMaterialName (material.name);
            let materialItem = new OV.MaterialItem (materialName, materialIndex, {
                onSelected : (materialIndex) => {
                    this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                }
            });
            this.navigatorItems.AddMaterialItem (materialIndex, materialItem);
            materialsItem.AddChild (materialItem);
        }

        let meshesItem = new OV.TreeViewGroupItem ('Meshes', 'meshes');
        this.treeView.AddItem (meshesItem);
        meshesItem.ShowChildren (true, null);
        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshItem = new OV.MeshItem (meshName, meshIndex, {
                onShowHide : (selectedMeshIndex) => {
                    this.ToggleMeshVisibility (selectedMeshIndex);
                },
                onIsolate : (selectedMeshIndex) => {
                    this.IsolateMesh (selectedMeshIndex);
                },                
                onFitToWindow : (selectedMeshIndex) => {
                    this.FitMeshToWindow (selectedMeshIndex);
                },
                onSelected : (selectedMeshIndex) => {
                    this.SetSelection (new OV.Selection (OV.SelectionType.Mesh, selectedMeshIndex));
                }
            });
            this.navigatorItems.AddMeshItem (meshIndex, meshItem);
            meshesItem.AddChild (meshItem);
        }

        this.UpdateInfoPanel ();
        this.Resize ();
    }

    IsMeshVisible (meshIndex)
    {
        let meshItem = this.navigatorItems.GetMeshItem (meshIndex);
        return meshItem.IsVisible ();
    }

    HasHiddenMesh ()
    {
        let hasHiddenMesh = false;
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            if (!meshItem.IsVisible ()) {
                hasHiddenMesh = true;
                return false;
            }
            return true;
        });
        return hasHiddenMesh;
    }

    ShowAllMeshes ()
    {
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            meshItem.SetVisible (true);
            return true;
        });
        this.callbacks.updateMeshesVisibility ();
    }

    ToggleMeshVisibility (meshIndex)
    {
        let meshItem = this.navigatorItems.GetMeshItem (meshIndex);
        meshItem.SetVisible (!meshItem.IsVisible ());
        this.callbacks.updateMeshesVisibility ();
    }

    IsMeshIsolated (meshIndex)
    {
        let isIsolated = true;
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            if (meshItem.GetMeshIndex () !== meshIndex && meshItem.IsVisible ()) {
                isIsolated = false;
                return false;
            }
            return true;
        });
        return isIsolated;
    }

    IsolateMesh (meshIndex)
    {
        let isIsolated = this.IsMeshIsolated (meshIndex);
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            if (meshItem.GetMeshIndex () === meshIndex || isIsolated) {
                meshItem.SetVisible (true);
            } else {
                meshItem.SetVisible (false);
            }
            return true;
        });
        this.callbacks.updateMeshesVisibility ();
    }

    GetSelectedMeshIndex ()
    {
        if (this.tempSelectedMeshIndex !== null) {
            return this.tempSelectedMeshIndex;
        }
        if (this.selection === null || this.selection.type !== OV.SelectionType.Mesh) {
            return null;
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
                obj.navigatorItems.GetMaterialItem (selection.index).SetSelected (select);
            } else if (selection.type === OV.SelectionType.Mesh) {
                obj.navigatorItems.GetMeshItem (selection.index).SetSelected (select);
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
        if (this.selection === null) {
            let usedMaterials = this.callbacks.getMaterialsForModel ();
            this.infoPanel.FillWithModelInfo (usedMaterials, {
                onMaterialSelect : (materialIndex) => {
                    this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                }
            });
            this.callbacks.onModelSelected ();
        } else {
            if (this.selection.type === OV.SelectionType.Material) {
                let usedByMeshes = this.callbacks.getMeshesForMaterial (this.selection.index);
                this.infoPanel.FillWithMaterialInfo (usedByMeshes, {
                    onMeshHover : (meshIndex) => {
                        this.SetTempSelectedMeshIndex (meshIndex);
                    },
                    onMeshSelect : (meshIndex) => {
                        this.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshIndex));
                    }
                });
                this.callbacks.onMaterialSelected (this.selection.index);
            } else if (this.selection.type === OV.SelectionType.Mesh) {
                let usedMaterials = this.callbacks.getMaterialsForMesh (this.selection.index);
                this.infoPanel.FillWithModelInfo (usedMaterials, {
                    onMaterialSelect : (materialIndex) => {
                        this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                    }
                });
                this.callbacks.onMeshSelected (this.selection.index);
            }
        }
        this.Resize ();
    }
    
    Clear ()
    {
        this.titleDiv.empty ();
        this.treeView.Clear ();
        this.infoPanel.Clear ();
        this.navigatorItems.Clear ();
        this.selection = null;
    }
};
