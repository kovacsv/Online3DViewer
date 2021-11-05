OV.NavigatorPanel = class extends OV.Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = $('<div>').addClass ('ov_navigator_tree_title').appendTo (this.panelDiv);
        this.treeDiv = $('<div>').addClass ('ov_navigator_tree_panel').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        this.treeView = new OV.TreeView (this.treeDiv);
    }

    Clear ()
    {
        this.titleDiv.empty ();
        this.treeView.Clear ();
    }

    GetName ()
    {
        return null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    Fill (importResult)
    {
        let panelName = this.GetName ();
        this.titleDiv.html (panelName).attr ('title', panelName);
    }
};

OV.NavigatorFilesPanel = class extends OV.NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetIcon ()
    {
        return 'files';
    }

    Resize ()
    {
        // TODO: height is not ok
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        super.Clear ();
    }

    GetName ()
    {
        return 'Files';
    }

    Fill (importResult)
    {
        super.Fill (importResult);
        const usedFiles = importResult.usedFiles;
        const missingFiles = importResult.missingFiles;

        let filesItem = new OV.TreeViewGroupItem ('Files', 'files');
        filesItem.ShowChildren (true);
        this.treeView.AddItem (filesItem);
        for (let i = 0; i < usedFiles.length; i++) {
            let file = usedFiles[i];
            let item = new OV.TreeViewSingleItem (file);
            filesItem.AddChild (item);
        }

        if (missingFiles.length > 0) {
            let missingFilesItem = new OV.TreeViewGroupItem ('Missing Files', 'missing_files');
            missingFilesItem.ShowChildren (true);
            this.treeView.AddItem (missingFilesItem);
            for (let i = 0; i < missingFiles.length; i++) {
                let file = missingFiles[i];
                let item = new OV.TreeViewButtonItem (file);
                let browseButton = new OV.TreeViewButton ('open');
                browseButton.OnClick (() => {
                    this.callbacks.onFileBrowseButtonClicked ();
                });
                item.AppendButton (browseButton);
                missingFilesItem.AddChild (item);
            }
        }
    }
};

OV.NavigatorMaterialsPanel = class extends OV.NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;
        this.materialIndexToItem = new Map ();
    }

    GetIcon ()
    {
        return 'materials';
    }

    Resize ()
    {
        // TODO: height is not ok
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        super.Clear ();
        this.materialIndexToItem = new Map ();
    }

    GetName ()
    {
        return 'Materials';
    }

    Init (callbacks)
    {
        super.Init (callbacks);
    }

    Fill (importResult)
    {
        super.Fill (importResult);
        const model = importResult.model;
        for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
            let material = model.GetMaterial (materialIndex);
            let materialName = OV.GetMaterialName (material.name);
            let materialItem = new OV.MaterialItem (materialName, materialIndex, {
                onSelected : (materialIndex) => {
                    this.callbacks.onMaterialSelected (materialIndex);
                }
            });
            this.materialIndexToItem.set (materialIndex, materialItem);
            this.treeView.AddItem (materialItem);
        }
    }

    GetMaterialItem (materialIndex)
    {
        return this.materialIndexToItem.get (materialIndex);
    }
};

// TODO: delete
OV.NavigatorPopupButton = class
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

OV.NavigatorMeshesPanel = class extends OV.NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);

        this.callbacks = null;
        this.treeView = new OV.TreeView (this.treeDiv);
        // TODO: delete
        this.navigatorItems = new OV.NavigatorItems ();
    }

    GetIcon ()
    {
        return 'meshes';
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        super.Clear ();
        this.navigatorItems.Clear ();
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    GetName ()
    {
        return 'Meshes';
    }

    Fill (importResult)
    {
        super.Fill (importResult);

        const model = importResult.model;
        const isFlat = !OV.FeatureSet.NavigatorTree;
        this.FillMeshTree (model, isFlat);

        this.Resize ();
    }

    FillMeshTree (model, isFlat)
    {
        function AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem)
        {
            let mesh = model.GetMesh (meshIndex);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshInstanceId = new OV.MeshInstanceId (node.GetId (), meshIndex);
            let meshItem = new OV.MeshItem (meshName, meshInstanceId, {
                onShowHide : (selectedMeshId) => {
                    navigator.callbacks.onMeshShowHide (selectedMeshId);
                },
                onFitToWindow : (selectedMeshId) => {
                    navigator.callbacks.onMeshFitToWindow (selectedMeshId);
                },
                onSelected : (selectedMeshId) => {
                    navigator.callbacks.onMeshSelected (selectedMeshId);
                }
            });
            navigator.navigatorItems.AddMeshItem (meshInstanceId, meshItem);
            parentItem.AddChild (meshItem);
        }

        function CreateNodeItem (navigator, name, icon, node)
        {
            const nodeName = OV.GetNodeName (name);
            const nodeId = node.GetId ();
            let nodeItem = new OV.NodeItem (nodeName, icon, nodeId, {
                onShowHide : (selectedNodeId) => {
                    navigator.callbacks.onNodeShowHide (selectedNodeId);
                },
                onFitToWindow : (selectedNodeId) => {
                    navigator.callbacks.onNodeFitToWindow (selectedNodeId);
                }
            });
            navigator.navigatorItems.AddNodeItem (nodeId, nodeItem);
            return nodeItem;
        }

        function AddModelNodeToTree (navigator, model, node, parentItem, isFlat)
        {
            for (let childNode of node.GetChildNodes ()) {
                if (isFlat) {
                    AddModelNodeToTree (navigator, model, childNode, parentItem, isFlat);
                } else {
                    let nodeItem = CreateNodeItem (navigator, node.GetName (), null, childNode);
                    parentItem.AddChild (nodeItem);
                    AddModelNodeToTree (navigator, model, childNode, nodeItem, isFlat);
                }
            }

            for (let meshIndex of node.GetMeshIndices ()) {
                AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem);
            }
        }

        let rootNode = model.GetRootNode ();
        let meshesItem = CreateNodeItem (this, 'Meshes', 'meshes', rootNode);
        this.treeView.AddItem (meshesItem);
        meshesItem.ShowChildren (true, null);

        AddModelNodeToTree (this, model, rootNode, meshesItem, isFlat);
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

    UpdatePopupButton ()
    {
        // if (this.selection === null) {
        //     let usedMaterials = this.callbacks.getMaterialsForModel ();
        //     this.popupButton.FillWithModelInfo (usedMaterials, {
        //         onMaterialSelect : (materialIndex) => {
        //             this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
        //         }
        //     });
        //     this.callbacks.onModelSelected ();
        // } else {
        //     if (this.selection.type === OV.SelectionType.Material) {
        //         let usedByMeshes = this.callbacks.getMeshesForMaterial (this.selection.materialIndex);
        //         this.popupButton.FillWithMaterialInfo (usedByMeshes, {
        //             onMeshHover : (meshInstanceId) => {
        //                 this.tempSelectedMeshId = meshInstanceId;
        //                 this.callbacks.updateMeshesSelection ();
        //             },
        //             onMeshSelect : (meshInstanceId) => {
        //                 this.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshInstanceId));
        //             }
        //         });
        //         this.callbacks.onMaterialSelected (this.selection.materialIndex);
        //     } else if (this.selection.type === OV.SelectionType.Mesh) {
        //         let usedMaterials = this.callbacks.getMaterialsForMesh (this.selection.meshInstanceId);
        //         this.popupButton.FillWithModelInfo (usedMaterials, {
        //             onMaterialSelect : (materialIndex) => {
        //                 this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
        //             }
        //         });
        //         this.callbacks.onMeshSelected (this.selection.meshInstanceId);
        //     }
        // }
        // this.Resize ();
    }
};
