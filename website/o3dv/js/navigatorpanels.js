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
        this.showTree = false;
        this.buttins = null;

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
        this.buttons = null;
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
        function CreateButton (parentDiv, button, extraClasses, onClick)
        {
            button.div = $('<div>').addClass ('ov_navigator_button').attr ('alt', button.name).attr ('title', button.name).appendTo (parentDiv);
            if (OV.IsDefined (extraClasses)) {
                button.div.addClass (extraClasses);
            }
            button.iconDiv = OV.AddSvgIcon (button.div, button.icon);
            button.div.click (() => {
                onClick ();
            });
        }

        function UpdateButtonsStatus (buttons, showTree, isHierarchical)
        {
            if (showTree) {
                buttons.flatList.iconDiv.removeClass ('selected');
                buttons.treeView.iconDiv.addClass ('selected');
            } else {
                buttons.flatList.iconDiv.addClass ('selected');
                buttons.treeView.iconDiv.removeClass ('selected');
            }
            if (showTree && isHierarchical) {
                buttons.separator.show ();
                buttons.expandAll.div.show ();
                buttons.collapseAll.div.show ();
            } else {
                buttons.separator.hide ();
                buttons.expandAll.div.hide ();
                buttons.collapseAll.div.hide ();
            }
        }

        function UpdateView (panel, importResult, isHierarchical)
        {
            panel.ClearMeshTree ();
            panel.FillMeshTree (importResult.model);
            UpdateButtonsStatus (panel.buttons, panel.showTree, isHierarchical);
            panel.callbacks.onViewTypeChanged ();
        }

        this.buttons = {
            flatList : {
                name : 'Flat list',
                icon : 'flat_list',
                div : null,
                iconDiv : null
            },
            treeView : {
                name : 'Tree view',
                icon : 'tree_view',
                div : null,
                iconDiv : null
            },
            separator : null,
            expandAll : {
                name : 'Expand all',
                icon : 'expand',
                div : null,
                iconDiv : null
            },
            collapseAll : {
                name : 'Collapse all',
                icon : 'collapse',
                div : null,
                iconDiv : null
            },
            showHideMeshes : {
                name : 'Show/hide meshes',
                icon : 'visible',
                div : null,
                iconDiv : null
            },
            fitToWindow : {
                name : 'Fit meshes to window',
                icon : 'fit',
                div : null,
                iconDiv : null
            }
        };

        const rootNode = importResult.model.GetRootNode ();
        let isHierarchical = rootNode.ChildNodeCount () > 0;

        CreateButton (this.buttonsDiv, this.buttons.flatList, null, () => {
            if (!this.showTree) {
                return;
            }
            this.showTree = false;
            UpdateView (this, importResult, isHierarchical);
        });

        CreateButton (this.buttonsDiv, this.buttons.treeView, null, () => {
            if (this.showTree) {
                return;
            }
            this.showTree = true;
            UpdateView (this, importResult, isHierarchical);
        });

        this.buttons.separator = $('<div>').addClass ('ov_navigator_buttons_separator').appendTo (this.buttonsDiv);

        CreateButton (this.buttonsDiv, this.buttons.expandAll, null, () => {
            this.rootItem.ExpandAll (true);
        });

        CreateButton (this.buttonsDiv, this.buttons.collapseAll, null, () => {
            this.rootItem.ExpandAll (false);
        });

        CreateButton (this.buttonsDiv, this.buttons.showHideMeshes, 'right', () => {
            let nodeId = this.rootItem.GetNodeId ();
            this.callbacks.onNodeShowHide (nodeId);
        });

        CreateButton (this.buttonsDiv, this.buttons.fitToWindow, 'right', () => {
            let nodeId = this.rootItem.GetNodeId ();
            this.callbacks.onNodeFitToWindow (nodeId);
        });

        UpdateButtonsStatus (this.buttons, this.showTree, isHierarchical);
    }

    FillMeshTree (model)
    {
        function AddMeshToNodeTree (panel, model, node, meshIndex, parentItem, showTree)
        {
            let mesh = model.GetMesh (meshIndex);
            let meshName = OV.GetMeshName (mesh.GetName ());
            let meshInstanceId = new OV.MeshInstanceId (node.GetId (), meshIndex);
            let meshItemIcon = showTree ? 'tree_mesh' : null;
            let meshItem = new OV.MeshItem (meshName, meshItemIcon, meshInstanceId, {
                onShowHide : (selectedMeshId) => {
                    panel.callbacks.onMeshShowHide (selectedMeshId);
                },
                onFitToWindow : (selectedMeshId) => {
                    panel.callbacks.onMeshFitToWindow (selectedMeshId);
                },
                onSelected : (selectedMeshId) => {
                    panel.callbacks.onMeshSelected (selectedMeshId);
                }
            });
            panel.meshInstanceIdToItem.set (meshInstanceId.GetKey (), meshItem);
            parentItem.AddChild (meshItem);
        }

        function CreateNodeItem (panel, node)
        {
            const nodeName = OV.GetNodeName (node.GetName ());
            const nodeId = node.GetId ();
            let nodeItem = new OV.NodeItem (nodeName, nodeId, {
                onShowHide : (selectedNodeId) => {
                    panel.callbacks.onNodeShowHide (selectedNodeId);
                },
                onFitToWindow : (selectedNodeId) => {
                    panel.callbacks.onNodeFitToWindow (selectedNodeId);
                }
            });
            panel.nodeIdToItem.set (nodeId, nodeItem);
            return nodeItem;
        }

        function CreateDummyRootItem (panel, node)
        {
            const nodeId = node.GetId ();
            let rootItem = new OV.NodeItem (null, nodeId, {
                onVisibilityChanged : (isVisible) => {
                    if (isVisible) {
                        OV.SetSvgIconImage (panel.buttons.showHideMeshes.iconDiv, 'visible');
                    } else {
                        OV.SetSvgIconImage (panel.buttons.showHideMeshes.iconDiv, 'hidden');
                    }
                }
            });
            rootItem.Show (false);
            rootItem.ShowChildren (true);
            panel.treeView.AddChild (rootItem);
            panel.nodeIdToItem.set (nodeId, rootItem);
            return rootItem;
        }

        function AddModelNodeToTree (panel, model, node, parentItem, showTree)
        {
            for (let childNode of node.GetChildNodes ()) {
                if (showTree) {
                    let nodeItem = CreateNodeItem (panel, childNode);
                    parentItem.AddChild (nodeItem);
                    AddModelNodeToTree (panel, model, childNode, nodeItem, showTree);
                } else {
                    AddModelNodeToTree (panel, model, childNode, parentItem, showTree);
                }
            }

            for (let meshIndex of node.GetMeshIndices ()) {
                AddMeshToNodeTree (panel, model, node, meshIndex, parentItem, showTree);
            }
        }

        let rootNode = model.GetRootNode ();
        this.rootItem = CreateDummyRootItem (this, rootNode);
        AddModelNodeToTree (this, model, rootNode, this.rootItem, this.showTree);
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

    EnumerateNodeItems (processor)
    {
        for (const nodeItem of this.nodeIdToItem.values ()) {
            if (!processor (nodeItem)) {
                break;
            }
        }
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

    ShowAllMeshes (show)
    {
        this.EnumerateNodeItems ((nodeItem) => {
            nodeItem.SetVisible (show, OV.NavigatorItemRecurse.No);
            return true;
        });
        this.EnumerateMeshItems ((meshItem) => {
            meshItem.SetVisible (show, OV.NavigatorItemRecurse.No);
            return true;
        });
    }

    ToggleNodeVisibility (nodeId)
    {
        let nodeItem = this.GetNodeItem (nodeId);
        nodeItem.SetVisible (!nodeItem.IsVisible (), OV.NavigatorItemRecurse.All);
    }

    ToggleMeshVisibility (meshInstanceId)
    {
        let meshItem = this.GetMeshItem (meshInstanceId);
        meshItem.SetVisible (!meshItem.IsVisible (), OV.NavigatorItemRecurse.Parents);
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
        this.ShowAllMeshes (false);
        this.ToggleMeshVisibility (meshInstanceId);
    }
};
