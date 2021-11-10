OV.NavigatorPopupButton = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.callbacks = null;
        this.popup = null;

        this.button = $('<div>').addClass ('ov_navigator_info_button').appendTo (this.parentDiv);
        this.buttonText = $('<div>').addClass ('ov_navigator_info_button_text').appendTo (this.button);
        OV.AddSvgIcon (this.button, 'arrow_right', 'ov_navigator_info_button_icon');
        this.button.click (() => {
            this.OnButtonClick ();
        });
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    OnButtonClick ()
    {

    }

    Clear ()
    {
        if (this.popup !== null) {
            this.popup.Hide ();
            this.popup = null;
        }
    }
};

OV.NavigatorMeshesPopupButton = class extends OV.NavigatorPopupButton
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.meshInfoArray = null;
    }

    Update (meshInfoArray)
    {
        this.meshInfoArray = meshInfoArray;
        if (this.meshInfoArray === null) {
            return;
        }

        let meshesText = 'Meshes (' + this.meshInfoArray.length + ')';
        this.buttonText.html (meshesText);
    }

    OnButtonClick ()
    {
        if (this.meshInfoArray === null) {
            return;
        }

        let meshItems = [];
        for (let i = 0; i < this.meshInfoArray.length; i++) {
            let meshInfo = this.meshInfoArray[i];
            meshItems.push ({
                name : OV.GetMeshName (meshInfo.name)
            });
        }

        if (meshItems.length === 0) {
            return;
        }

        this.popup = OV.ShowListPopup (meshItems, {
            calculatePosition : (contentDiv) => {
                return OV.CalculatePopupPositionToElementBottomRight (this.button, contentDiv);
            },
            onHoverStart : (index) => {
                const meshData = this.meshInfoArray[index];
                this.callbacks.onMeshHover (meshData.meshId);
            },
            onHoverStop : (index) => {
                this.callbacks.onMeshHover (null);
            },
            onClick : (index) => {
                const meshData = this.meshInfoArray[index];
                this.callbacks.onMeshSelected (meshData.meshId);
            }
        });
    }
};

OV.NavigatorMaterialsPopupButton = class extends OV.NavigatorPopupButton
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.materialInfoArray = null;
    }

    Update (materialInfoArray)
    {
        this.materialInfoArray = materialInfoArray;
        if (this.materialInfoArray === null) {
            return;
        }

        let materialsText = 'Materials (' + this.materialInfoArray.length + ')';
        this.buttonText.html (materialsText);
    }

    OnButtonClick ()
    {
        if (this.materialInfoArray === null) {
            return;
        }

        let materialItems = [];
        for (let i = 0; i < this.materialInfoArray.length; i++) {
            let usedMaterial = this.materialInfoArray[i];
            materialItems.push ({
                name : OV.GetMaterialName (usedMaterial.name),
                color : usedMaterial.color
            });
        }

        if (materialItems.length === 0) {
            return;
        }

        this.popup = OV.ShowListPopup (materialItems, {
            calculatePosition : (contentDiv) => {
                return OV.CalculatePopupPositionToElementBottomRight (this.button, contentDiv);
            },
            onClick : (index) => {
                let usedMaterial = this.materialInfoArray[index];
                this.callbacks.onMaterialSelected (usedMaterial.index);
            }
        });
    }
};

OV.NavigatorPanel = class extends OV.Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = $('<div>').addClass ('ov_navigator_tree_title').appendTo (this.panelDiv);
        this.treeDiv = $('<div>').addClass ('ov_navigator_tree_panel').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        this.treeView = new OV.TreeView (this.treeDiv);

        let panelName = this.GetName ();
        this.titleDiv.html (panelName).attr ('title', panelName);
    }

    Clear ()
    {
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

    }
};

OV.NavigatorFilesPanel = class extends OV.NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetName ()
    {
        return 'Files';
    }

    GetIcon ()
    {
        return 'files';
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
    }

    Fill (importResult)
    {
        super.Fill (importResult);
        const usedFiles = importResult.usedFiles;
        const missingFiles = importResult.missingFiles;

        if (missingFiles.length > 0) {
            let missingFilesItem = new OV.TreeViewGroupItem ('Missing Files', null);
            missingFilesItem.ShowChildren (true);
            this.treeView.AddChild (missingFilesItem);
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
            let filesItem = new OV.TreeViewGroupItem ('Available Files', null);
            filesItem.ShowChildren (true);
            this.treeView.AddChild (filesItem);
            for (let i = 0; i < usedFiles.length; i++) {
                let file = usedFiles[i];
                let item = new OV.TreeViewSingleItem (file);
                filesItem.AddChild (item);
            }
        } else {
            for (let i = 0; i < usedFiles.length; i++) {
                let file = usedFiles[i];
                let item = new OV.TreeViewSingleItem (file);
                this.treeView.AddChild (item);
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

        this.popupDiv = $('<div>').addClass ('ov_navigator_info_panel').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        this.meshesButton = new OV.NavigatorMeshesPopupButton (this.popupDiv);
    }

    GetName ()
    {
        return 'Materials';
    }

    GetIcon ()
    {
        return 'materials';
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let popupHeight = this.popupDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - titleHeight - popupHeight, true);
    }

    Clear ()
    {
        super.Clear ();
        this.meshesButton.Clear ();
        this.materialIndexToItem = new Map ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.meshesButton.Init ({
            onMeshHover : (meshInstanceId) => {
                this.callbacks.onMeshTemporarySelected (meshInstanceId);
            },
            onMeshSelected : (meshInstanceId) => {
                this.callbacks.onMeshSelected (meshInstanceId);
            }
        });
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
            this.treeView.AddChild (materialItem);
        }
    }

    GetMaterialItem (materialIndex)
    {
        return this.materialIndexToItem.get (materialIndex);
    }

    SelectMaterialItem (materialIndex, isSelected)
    {
        this.GetMaterialItem (materialIndex).SetSelected (isSelected);
    }

    UpdateMeshList (meshInfoArray)
    {
        this.meshesButton.Update (meshInfoArray);
    }
};

OV.NavigatorMeshesPanel = class extends OV.NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);

        this.callbacks = null;
        this.nodeIdToItem = new Map ();
        this.meshInstanceIdToItem = new Map ();
        this.rootItem = null;
        this.showHideButton = null;
        this.isHierarchical = false;

        this.treeView.AddClass ('tight');
        this.buttonsDiv = $('<div>').addClass ('ov_navigator_buttons').insertBefore (this.treeDiv);

        this.popupDiv = $('<div>').addClass ('ov_navigator_info_panel').addClass ('ov_thin_scrollbar').appendTo (this.panelDiv);
        this.materialsButton = new OV.NavigatorMaterialsPopupButton (this.popupDiv);
    }

    GetName ()
    {
        return 'Meshes';
    }

    GetIcon ()
    {
        return 'meshes';
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let buttonsHeight = this.buttonsDiv.outerHeight (true);
        let popupHeight = this.popupDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.treeDiv.outerHeight (height - titleHeight - buttonsHeight - popupHeight);
    }

    Clear ()
    {
        this.ClearMeshTree ();
        this.buttonsDiv.empty ();
        this.showHideButton = null;
    }

    ClearMeshTree ()
    {
        super.Clear ();
        this.materialsButton.Clear ();
        this.nodeIdToItem = new Map ();
        this.meshInstanceIdToItem = new Map ();
        this.rootItem = null;
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.materialsButton.Init ({
            onMeshHover : (meshInstanceId) => {
                this.callbacks.onMeshTemporarySelected (meshInstanceId);
            },
            onMeshSelected : (meshInstanceId) => {
                this.callbacks.onMeshSelected (meshInstanceId);
            },
            onMaterialSelected : (materialIndex) => {
                this.callbacks.onMaterialSelected (materialIndex);
            }
        });
    }

    Fill (importResult)
    {
        super.Fill (importResult);

        const model = importResult.model;
        this.FillButtons (importResult);
        this.FillMeshTree (model);

        this.Resize ();
    }

    FillButtons (importResult)
    {
        function CreateButton (parentDiv, tooltip, icon, extraClasses, onClick)
        {
            let button = $('<div>').addClass ('ov_navigator_button').attr ('title', tooltip).appendTo (parentDiv);
            if (extraClasses !== null) {
                button.addClass (extraClasses);
            }
            let buttonIcon = OV.AddSvgIcon (button, icon);
            button.click (() => {
                onClick ();
            });
            return buttonIcon;
        }

        CreateButton (this.buttonsDiv, 'Flat list', 'flat_list', null, () => {
            if (!this.isHierarchical) {
                return;
            }
            this.isHierarchical = false;
            this.ClearMeshTree ();
            this.FillMeshTree (importResult.model);
            this.callbacks.onSelectionRemoved ();
        });

        CreateButton (this.buttonsDiv, 'Tree view', 'tree_view', null, () => {
            if (this.isHierarchical) {
                return;
            }
            this.isHierarchical = true;
            this.ClearMeshTree ();
            this.FillMeshTree (importResult.model);
            this.callbacks.onSelectionRemoved ();
        });

        CreateButton (this.buttonsDiv, 'Expand all', 'expand', null, () => {
            this.rootItem.ExpandAll (true);
        });

        CreateButton (this.buttonsDiv, 'Collapse all', 'collapse', null, () => {
            this.rootItem.ExpandAll (false);
        });

        this.showHideButton = CreateButton (this.buttonsDiv, 'Show/hide meshes', 'visible', 'right', () => {
            let nodeId = this.rootItem.GetNodeId ();
            this.callbacks.onNodeShowHide (nodeId);
        });

        CreateButton (this.buttonsDiv, 'Fit meshes to window', 'fit', 'right', () => {
            let nodeId = this.rootItem.GetNodeId ();
            this.callbacks.onNodeFitToWindow (nodeId);
        });
    }

    FillMeshTree (model)
    {
        function AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem, isHierarchical)
        {
            let mesh = model.GetMesh (meshIndex);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshInstanceId = new OV.MeshInstanceId (node.GetId (), meshIndex);
            let meshItemIcon = isHierarchical ? 'tree_mesh' : null;
            let meshItem = new OV.MeshItem (meshName, meshItemIcon, meshInstanceId, {
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
            navigator.meshInstanceIdToItem.set (meshInstanceId.GetKey (), meshItem);
            parentItem.AddChild (meshItem);
        }

        function CreateNodeItem (navigator, name, node)
        {
            const nodeName = OV.GetNodeName (name);
            const nodeId = node.GetId ();
            let nodeItem = new OV.NodeItem (nodeName, nodeId, {
                onShowHide : (selectedNodeId) => {
                    navigator.callbacks.onNodeShowHide (selectedNodeId);
                },
                onFitToWindow : (selectedNodeId) => {
                    navigator.callbacks.onNodeFitToWindow (selectedNodeId);
                }
            });
            navigator.nodeIdToItem.set (nodeId, nodeItem);
            return nodeItem;
        }

        function CreateDummyRootItem (navigator, node)
        {
            const nodeId = node.GetId ();
            let rootItem = new OV.NodeItem (null, nodeId, {
                onVisibilityChanged : (isVisible) => {
                    if (isVisible) {
                        OV.SetSvgIconImage (navigator.showHideButton, 'visible');
                    } else {
                        OV.SetSvgIconImage (navigator.showHideButton, 'hidden');
                    }
                }
            });
            rootItem.Show (false);
            rootItem.ShowChildren (true);
            navigator.treeView.AddChild (rootItem);
            navigator.nodeIdToItem.set (nodeId, rootItem);
            return rootItem;
        }

        function AddModelNodeToTree (navigator, model, node, parentItem, isHierarchical)
        {
            for (let childNode of node.GetChildNodes ()) {
                if (isHierarchical) {
                    let nodeItem = CreateNodeItem (navigator, node.GetName (), childNode);
                    parentItem.AddChild (nodeItem);
                    AddModelNodeToTree (navigator, model, childNode, nodeItem, isHierarchical);
                } else {
                    AddModelNodeToTree (navigator, model, childNode, parentItem, isHierarchical);
                }
            }

            for (let meshIndex of node.GetMeshIndices ()) {
                AddMeshToNodeTree (navigator, model, node, meshIndex, parentItem, isHierarchical);
            }
        }

        let rootNode = model.GetRootNode ();
        this.rootItem = CreateDummyRootItem (this, rootNode);
        AddModelNodeToTree (this, model, rootNode, this.rootItem, this.isHierarchical);
    }

    UpdateMaterialList (materialInfoArray)
    {
        this.materialsButton.Update (materialInfoArray);
    }

    GetNodeItem (nodeId)
    {
        return this.nodeIdToItem.get (nodeId);
    }

    MeshItemCount ()
    {
        return this.meshInstanceIdToItem.size;
    }

    GetMeshItem (meshInstanceId)
    {
        return this.meshInstanceIdToItem.get (meshInstanceId.GetKey ());
    }

    EnumerateMeshItems (processor)
    {
        for (const meshItem of this.meshInstanceIdToItem.values ()) {
            if (!processor (meshItem)) {
                break;
            }
        }
    }

    IsMeshVisible (meshInstanceId)
    {
        let meshItem = this.GetMeshItem (meshInstanceId);
        return meshItem.IsVisible ();
    }

    HasHiddenMesh ()
    {
        let hasHiddenMesh = false;
        this.EnumerateMeshItems ((meshItem) => {
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
        this.EnumerateMeshItems ((meshItem) => {
            meshItem.SetVisible (true);
            return true;
        });
    }

    ToggleNodeVisibility (nodeId)
    {
        let nodeItem = this.GetNodeItem (nodeId);
        nodeItem.SetVisible (!nodeItem.IsVisible ());
    }

    ToggleMeshVisibility (meshInstanceId)
    {
        let meshItem = this.GetMeshItem (meshInstanceId);
        meshItem.SetVisible (!meshItem.IsVisible ());
    }

    IsMeshIsolated (meshInstanceId)
    {
        let isIsolated = true;
        this.EnumerateMeshItems ((meshItem) => {
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
        this.EnumerateMeshItems ((meshItem) => {
            if (meshItem.GetMeshInstanceId ().IsEqual (meshInstanceId) || isIsolated) {
                meshItem.SetVisible (true);
            } else {
                meshItem.SetVisible (false);
            }
            return true;
        });
    }
};
