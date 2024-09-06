import { GetDomElementOuterWidth, SetDomElementOuterHeight, SetDomElementOuterWidth } from '../engine/viewer/domutils.js';
import { NavigatorFilesPanel } from './navigatorfilespanel.js';
import { NavigatorMeshesPanel } from './navigatormeshespanel.js';
import { PanelSet } from './panelset.js';

export const SelectionType =
{
    Material : 1,
    Mesh : 2
};

export class Selection
{
    constructor (type, data)
    {
        this.type = type;
        this.materialIndex = null;
        this.meshInstanceId = null;
        if (this.type === SelectionType.Material) {
            this.materialIndex = data;
        } else if (this.type === SelectionType.Mesh) {
            this.meshInstanceId = data;
        }
    }

    IsEqual (rhs)
    {
        if (this.type !== rhs.type) {
            return false;
        }
        if (this.type === SelectionType.Material) {
            return this.materialIndex === rhs.materialIndex;
        } else if (this.type === SelectionType.Mesh) {
            return this.meshInstanceId.IsEqual (rhs.meshInstanceId);
        }
    }
}

export class Navigator
{
    constructor (mainDiv)
    {
        this.mainDiv = mainDiv;

        this.panelSet = new PanelSet (mainDiv);
        this.callbacks = null;
        this.selection = null;
        this.tempSelectedMeshId = null;

        this.filesPanel = new NavigatorFilesPanel (this.panelSet.GetContentDiv ());
        this.meshesPanel = new NavigatorMeshesPanel (this.panelSet.GetContentDiv ());

        this.panelSet.AddPanel (this.filesPanel);
        this.panelSet.AddPanel (this.meshesPanel);
        this.panelSet.ShowPanel (this.meshesPanel);
    }

    IsPanelsVisible ()
    {
        return this.panelSet.IsPanelsVisible ();
    }

    ShowPanels (show)
    {
        this.panelSet.ShowPanels (show);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;

        this.panelSet.Init ({
            onResizeRequested : () => {
                this.callbacks.onResizeRequested ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            }
        });

        this.filesPanel.Init ({
            onFileBrowseButtonClicked : () => {
                this.callbacks.openFileBrowserDialog ();
            }
        });

        this.meshesPanel.Init ({
            onMeshSelected : (meshId) => {
                this.SetSelection (new Selection (SelectionType.Mesh, meshId));
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
            },
            onMaterialSelected : (materialIndex) => {
                this.SetSelection (new Selection (SelectionType.Material, materialIndex));
            },
            onViewTypeChanged : () => {
                this.SetSelection (null);
            }
        });
    }

    GetWidth ()
    {
        return GetDomElementOuterWidth (this.mainDiv);
    }

    SetWidth (width)
    {
        SetDomElementOuterWidth (this.mainDiv, width);
    }

    Resize (height)
    {
        SetDomElementOuterHeight (this.mainDiv, height);
        this.panelSet.Resize ();
    }

    FillTree (importResult)
    {
        this.filesPanel.Fill (importResult);
        if (importResult.missingFiles.length === 0) {
            this.panelSet.SetPanelIcon (this.filesPanel, 'files');
        } else {
            this.panelSet.SetPanelIcon (this.filesPanel, 'missing_files');
        }
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

    ShowAllMeshes (show)
    {
        this.meshesPanel.ShowAllMeshes (show);
        this.callbacks.onMeshVisibilityChanged ();
    }

    ToggleNodeVisibility (nodeId)
    {
        this.meshesPanel.ToggleNodeVisibility (nodeId);
        this.callbacks.onMeshVisibilityChanged ();
    }

    ToggleMeshVisibility (meshInstanceId)
    {
        this.meshesPanel.ToggleMeshVisibility (meshInstanceId);
        this.callbacks.onMeshVisibilityChanged ();
    }

    IsMeshIsolated (meshInstanceId)
    {
        return this.meshesPanel.IsMeshIsolated (meshInstanceId);
    }

    IsolateMesh (meshInstanceId)
    {
        this.meshesPanel.IsolateMesh (meshInstanceId);
        this.callbacks.onMeshVisibilityChanged ();
    }

    GetSelectedMeshId ()
    {
        if (this.tempSelectedMeshId !== null) {
            return this.tempSelectedMeshId;
        }
        if (this.selection === null || this.selection.type !== SelectionType.Mesh) {
            return null;
        }
        return this.selection.meshInstanceId;
    }

    SetSelection (selection)
    {
        function SetEntitySelection (navigator, selection, select)
        {
            if (selection.type === SelectionType.Material) {
                if (select && navigator.panelSet.IsPanelsVisible ()) {
                    navigator.panelSet.ShowPanel (navigator.materialsPanel);
                }
                navigator.materialsPanel.SelectMaterialItem (selection.materialIndex, select);
            } else if (selection.type === SelectionType.Mesh) {
                if (select && navigator.panelSet.IsPanelsVisible ()) {
                    navigator.panelSet.ShowPanel (navigator.meshesPanel);
                }
                navigator.meshesPanel.GetMeshItem (selection.meshInstanceId).SetSelected (select);
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

        this.callbacks.onMeshSelectionChanged ();
    }

    OnSelectionChanged ()
    {
        if (this.selection === null) {
            this.callbacks.onSelectionCleared ();
        } else {
            if (this.selection.type === SelectionType.Material) {
                this.callbacks.onMaterialSelected (this.selection.materialIndex);
            } else if (this.selection.type === SelectionType.Mesh) {
                this.callbacks.onMeshSelected (this.selection.meshInstanceId);
            }
        }
        this.UpdatePanels ();
    }

    UpdatePanels ()
    {
        let materialIndex = null;
        let meshInstanceId = null;
        if (this.selection !== null) {
            if (this.selection.type === SelectionType.Material) {
                materialIndex = this.selection.materialIndex;
            } else if (this.selection.type === SelectionType.Mesh) {
                meshInstanceId = this.selection.meshInstanceId;
            }
        }
        let usedByMaterials = this.callbacks.getMaterialsForMesh (meshInstanceId);
        this.meshesPanel.UpdateMaterialList (usedByMaterials);
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
}
