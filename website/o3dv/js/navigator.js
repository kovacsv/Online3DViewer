OV.SelectionType =
{
    Material : 1,
    Mesh : 2
};

OV.Selection = class
{
    constructor (type, data)
    {
        this.type = type;
        this.materialIndex = null;
        this.meshInstanceId = null;
        if (this.type === OV.SelectionType.Material) {
            this.materialIndex = data;
        } else if (this.type === OV.SelectionType.Mesh) {
            this.meshInstanceId = data;
        }
    }

    IsEqual (rhs)
    {
        if (this.type !== rhs.type) {
            return false;
        }
        if (this.type === OV.SelectionType.Material) {
            return this.materialIndex === rhs.materialIndex;
        } else if (this.type === OV.SelectionType.Mesh) {
            return this.meshInstanceId.IsEqual (rhs.meshInstanceId);
        }
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
                    const meshData = usedByMeshes[index];
                    callbacks.onMeshHover (meshData.meshId);
                },
                onHoverStop : (index) => {
                    callbacks.onMeshHover (null);
                },
                onClick : (index) => {
                    const meshData = usedByMeshes[index];
                    callbacks.onMeshSelect (meshData.meshId);
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
        OV.AddSvgIcon (button, 'arrow_right', 'ov_navigator_info_button_icon');
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
        this.tempSelectedMeshId = null;
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

        this.FillMeshTree (model);

        this.UpdateInfoPanel ();
        this.Resize ();
    }

    FillMeshTree (model)
    {
        function AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem)
        {
            let mesh = model.GetMesh (meshIndex);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshInstanceId = new OV.MeshInstanceId (node.GetId (), meshIndex);
            let meshItem = new OV.MeshItem (meshName, meshInstanceId, {
                onShowHide : (selectedMeshId) => {
                    navigator.ToggleMeshVisibility (selectedMeshId);
                },
                onFitToWindow : (selectedMeshId) => {
                    navigator.FitMeshToWindow (selectedMeshId);
                },
                onSelected : (selectedMeshId) => {
                    navigator.SetSelection (new OV.Selection (OV.SelectionType.Mesh, selectedMeshId));
                }
            });
            navigator.navigatorItems.AddMeshItem (meshInstanceId, meshItem);
            parentItem.AddChild (meshItem);
        }

        function AddModelNodeToTree (navigator, model, node, parentItem)
        {
            for (let childNode of node.GetChildNodes ()) {
                if (OV.FeatureSet.NavigatorTree) {
                    const nodeName = OV.GetNodeName (childNode.GetName ());
                    const nodeId = childNode.GetId ();
                    let nodeItem = new OV.NodeItem (nodeName, nodeId, {
                        onShowHide : (selectedNodeId) => {
                            console.log ('sh');
                        },
                        onFitToWindow : (selectedNodeId) => {
                            console.log ('fit');
                        }
                    });
                    parentItem.AddChild (nodeItem);
                    nodeItem.ShowChildren (true, null);
                    AddModelNodeToTree (navigator, model, childNode, nodeItem);
                } else {
                    AddModelNodeToTree (navigator, model, childNode, parentItem);
                }
            }

            for (let meshIndex of node.GetMeshIndices ()) {
                AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem);
            }
        }

        let meshesItem = new OV.TreeViewGroupItem ('Meshes', 'meshes');
        this.treeView.AddItem (meshesItem);
        meshesItem.ShowChildren (true, null);

        let rootNode = model.GetRootNode ();
        AddModelNodeToTree (this, model, rootNode, meshesItem);
    }

    MeshItemCount ()
    {
        return this.navigatorItems.MeshItemCount ();
    }

    IsMeshVisible (meshInstanceId)
    {
        let meshItem = this.navigatorItems.GetMeshItem (meshInstanceId);
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

    ToggleMeshVisibility (meshInstanceId)
    {
        let meshItem = this.navigatorItems.GetMeshItem (meshInstanceId);
        meshItem.SetVisible (!meshItem.IsVisible ());
        this.callbacks.updateMeshesVisibility ();
    }

    IsMeshIsolated (meshInstanceId)
    {
        let isIsolated = true;
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            if (!meshItem.GetMeshInstanceId ().IsEqual (meshInstanceId) && meshItem.IsVisible ()) {
                isIsolated = false;
                return false;
            }
            return true;
        });
        return isIsolated;
    }

    IsolateMesh (meshInstanceId)
    {
        let isIsolated = this.IsMeshIsolated (meshInstanceId);
        this.navigatorItems.EnumerateMeshItems ((meshItem) => {
            if (meshItem.GetMeshInstanceId ().IsEqual (meshInstanceId) || isIsolated) {
                meshItem.SetVisible (true);
            } else {
                meshItem.SetVisible (false);
            }
            return true;
        });
        this.callbacks.updateMeshesVisibility ();
    }

    GetSelectedMeshId ()
    {
        if (this.tempSelectedMeshId !== null) {
            return this.tempSelectedMeshId;
        }
        if (this.selection === null || this.selection.type !== OV.SelectionType.Mesh) {
            return null;
        }
        return this.selection.meshInstanceId;
    }

    SetSelection (selection)
    {
        function SetEntitySelection (obj, selection, select)
        {
            if (selection.type === OV.SelectionType.Material) {
                obj.navigatorItems.GetMaterialItem (selection.materialIndex).SetSelected (select);
            } else if (selection.type === OV.SelectionType.Mesh) {
                obj.navigatorItems.GetMeshItem (selection.meshInstanceId).SetSelected (select);
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
        this.tempSelectedMeshId = null;

        if (this.selection !== null) {
            if (oldSelection !== null && oldSelection.IsEqual (this.selection)) {
                SetEntitySelection (this, this.selection, false);
                SetCurrentSelection (this, null);
            } else {
                SetEntitySelection (this, this.selection, true);
            }
        }

        this.callbacks.updateMeshesSelection ();
    }

    FitMeshToWindow (meshInstanceId)
    {
        this.callbacks.fitMeshToWindow (meshInstanceId);
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
                let usedByMeshes = this.callbacks.getMeshesForMaterial (this.selection.materialIndex);
                this.infoPanel.FillWithMaterialInfo (usedByMeshes, {
                    onMeshHover : (meshInstanceId) => {
                        this.tempSelectedMeshId = meshInstanceId;
                        this.callbacks.updateMeshesSelection ();
                    },
                    onMeshSelect : (meshInstanceId) => {
                        this.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshInstanceId));
                    }
                });
                this.callbacks.onMaterialSelected (this.selection.materialIndex);
            } else if (this.selection.type === OV.SelectionType.Mesh) {
                let usedMaterials = this.callbacks.getMaterialsForMesh (this.selection.meshInstanceId);
                this.infoPanel.FillWithModelInfo (usedMaterials, {
                    onMaterialSelect : (materialIndex) => {
                        this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
                    }
                });
                this.callbacks.onMeshSelected (this.selection.meshInstanceId);
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
