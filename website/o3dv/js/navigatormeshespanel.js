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
        this.buttonText.innerHTML = materialsText;
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
        this.buttons = null;

        this.titleDiv.classList.add ('nomargin');
        this.treeView.AddClass ('tight');
        this.buttonsDiv = OV.CreateDiv ('ov_navigator_buttons');
        OV.InsertDomElementBefore (this.buttonsDiv, this.treeDiv);

        this.popupDiv = OV.AddDiv (this.panelDiv, 'ov_navigator_info_panel');
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
        let titleHeight = this.titleDiv.offsetHeight;
        let buttonsHeight = OV.GetDomElementOuterHeight (this.buttonsDiv);
        let popupHeight = OV.GetDomElementOuterHeight (this.popupDiv);
        let height = this.parentDiv.offsetHeight;
        OV.SetDomElementHeight (this.treeDiv, height - titleHeight - buttonsHeight - popupHeight);
    }

    Clear ()
    {
        this.ClearMeshTree ();
        OV.ClearDomElement (this.buttonsDiv);
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
        function CreateButton (parentDiv, button, className, onClick)
        {
            button.div = OV.AddDiv (parentDiv, 'ov_navigator_button');
            button.div.setAttribute ('alt', button.name);
            button.div.setAttribute ('title', button.name);
            if (className) {
                button.div.classList.add (className);
            }
            button.iconDiv = OV.AddSvgIconElement (button.div, button.icon);
            button.div.addEventListener ('click', () => {
                onClick ();
            });
        }

        function UpdateButtonsStatus (buttons, showTree, isHierarchical)
        {
            if (showTree) {
                buttons.flatList.iconDiv.classList.remove ('selected');
                buttons.treeView.iconDiv.classList.add ('selected');
            } else {
                buttons.flatList.iconDiv.classList.add ('selected');
                buttons.treeView.iconDiv.classList.remove ('selected');
            }
            let showExpandButtons = showTree && isHierarchical;
            OV.ShowDomElement (buttons.separator, showExpandButtons);
            OV.ShowDomElement (buttons.expandAll.div, showExpandButtons);
            OV.ShowDomElement (buttons.collapseAll.div, showExpandButtons);
        }

        function UpdateView (panel, importResult, isHierarchical)
        {
            let hiddenMeshInstanceIds = [];
            panel.EnumerateMeshItems ((meshItem) => {
                if (!meshItem.IsVisible ()) {
                    hiddenMeshInstanceIds.push (meshItem.GetMeshInstanceId ());
                }
                return true;
            });

            panel.ClearMeshTree ();
            panel.FillMeshTree (importResult.model);

            for (let meshInstanceId of hiddenMeshInstanceIds) {
                let meshItem = panel.GetMeshItem (meshInstanceId);
                meshItem.SetVisible (false, OV.NavigatorItemRecurse.Parents);
            }

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
        let isHierarchical = false;
        for (let childNode of rootNode.GetChildNodes ()) {
            if (childNode.GetType () === OV.NodeType.GroupNode) {
                isHierarchical = true;
                break;
            }
        }

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

        this.buttons.separator = OV.AddDiv (this.buttonsDiv, 'ov_navigator_buttons_separator');

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
                        OV.SetSvgIconImageElement (panel.buttons.showHideMeshes.iconDiv, 'visible');
                    } else {
                        OV.SetSvgIconImageElement (panel.buttons.showHideMeshes.iconDiv, 'hidden');
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
            let meshNodes = [];
            for (let childNode of node.GetChildNodes ()) {
                if (showTree) {
                    if (childNode.GetType () === OV.NodeType.GroupNode) {
                        let nodeItem = CreateNodeItem (panel, childNode);
                        parentItem.AddChild (nodeItem);
                        AddModelNodeToTree (panel, model, childNode, nodeItem, showTree);
                    } else if (childNode.GetType () === OV.NodeType.MeshNode) {
                        meshNodes.push (childNode);
                    }
                } else {
                    AddModelNodeToTree (panel, model, childNode, parentItem, showTree);
                }
            }
            for (let meshNode of meshNodes) {
                AddModelNodeToTree (panel, model, meshNode, parentItem, showTree);
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
