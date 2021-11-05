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

OV.Navigator = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.panelSet = new OV.PanelSet (parentDiv);
        this.callbacks = null;
        this.selection = null;
        this.tempSelectedMeshId = null;

        this.filesPanel = new OV.NavigatorFilesPanel (this.panelSet.GetContentDiv ());
        this.materialsPanel = new OV.NavigatorMaterialsPanel (this.panelSet.GetContentDiv ());
        this.meshesPanel = new OV.NavigatorMeshesPanel (this.panelSet.GetContentDiv ());

        this.panelSet.AddPanel (this.filesPanel);
        this.panelSet.AddPanel (this.materialsPanel);
        this.panelSet.AddPanel (this.meshesPanel);
        this.panelSet.ShowPanel (this.meshesPanel);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
        this.filesPanel.Init ({
            onFileBrowseButtonClicked : () => {
                this.callbacks.openFileBrowserDialog ();
            }
        });
        this.materialsPanel.Init ({
            onMaterialSelected : (materialIndex) => {
                this.SetSelection (new OV.Selection (OV.SelectionType.Material, materialIndex));
            }
        });
        this.meshesPanel.Init ({
            onMeshSelected : (meshId) => {
                this.SetSelection (new OV.Selection (OV.SelectionType.Mesh, meshId));
            },
            onMeshShowHide : (meshId) => {
                this.ToggleMeshVisibility (meshId);
            },
            onMeshFitToWindow : (meshId) => {
                this.FitMeshToWindow (meshId);
            },
            onNodeShowHide : (nodeId) => {
                this.ToggleNodeVisibility (nodeId);
            },
            onNodeFitToWindow : (nodeId) => {
                this.FitNodeToWindow (nodeId);
            }
        });
    }

    Resize ()
    {
        this.panelSet.Resize ();
    }

    FillTree (importResult)
    {
        this.filesPanel.Fill (importResult);
        this.materialsPanel.Fill (importResult);
        this.meshesPanel.Fill (importResult);
        this.OnSelectionChanged ();
    }

    MeshItemCount ()
    {
        return this.meshesPanel.MeshItemCount ();
    }

    IsMeshVisible (meshInstanceId)
    {
        return this.meshesPanel.IsMeshVisible (meshInstanceId);
    }

    HasHiddenMesh ()
    {
        return this.meshesPanel.HasHiddenMesh ();
    }

    ShowAllMeshes ()
    {
        this.meshesPanel.ShowAllMeshes ();
        this.callbacks.updateMeshesVisibility ();
    }

    ToggleNodeVisibility (nodeId)
    {
        this.meshesPanel.ToggleNodeVisibility (nodeId);
        this.callbacks.updateMeshesVisibility ();
    }

    ToggleMeshVisibility (meshInstanceId)
    {
        this.meshesPanel.ToggleMeshVisibility (meshInstanceId);
        this.callbacks.updateMeshesVisibility ();
    }

    IsMeshIsolated (meshInstanceId)
    {
        return this.meshesPanel.IsMeshIsolated (meshInstanceId);
    }

    IsolateMesh (meshInstanceId)
    {
        this.meshesPanel.IsolateMesh (meshInstanceId);
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
        function SetEntitySelection (navigator, selection, select)
        {
            if (selection.type === OV.SelectionType.Material) {
                navigator.materialsPanel.GetMaterialItem (selection.materialIndex).SetSelected (select);
                if (select) {
                    navigator.panelSet.ShowPanel (navigator.materialsPanel);
                }
            } else if (selection.type === OV.SelectionType.Mesh) {
                navigator.meshesPanel.GetMeshItem (selection.meshInstanceId).SetSelected (select);
                if (select) {
                    navigator.panelSet.ShowPanel (navigator.meshesPanel);
                }
            }
        }

        function SetCurrentSelection (navigator, selection)
        {
            navigator.selection = selection;
            navigator.OnSelectionChanged ();
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

    OnSelectionChanged ()
    {
        if (this.selection === null) {
            this.callbacks.onModelSelected ();
        } else {
            if (this.selection.type === OV.SelectionType.Material) {
                this.callbacks.onMaterialSelected (this.selection.materialIndex);
            } else if (this.selection.type === OV.SelectionType.Mesh) {
                this.callbacks.onMeshSelected (this.selection.meshInstanceId);
            }
        }
        this.Resize ();
    }

    FitNodeToWindow (nodeId)
    {
        let meshInstanceIdSet = new Set ();
        let nodeItem = this.meshesPanel.GetNodeItem (nodeId);
        nodeItem.EnumerateMeshItems ((meshItem) => {
            meshInstanceIdSet.add (meshItem.GetMeshInstanceId ());
        });
        this.callbacks.fitMeshesToWindow (meshInstanceIdSet);
    }

    FitMeshToWindow (meshInstanceId)
    {
        this.callbacks.fitMeshToWindow (meshInstanceId);
    }

    Clear ()
    {
        this.panelSet.Clear ();
        this.selection = null;
    }
};
