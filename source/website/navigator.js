import { ShowDomElement, SetDomElementHeight, GetDomElementOuterWidth, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { NavigatorFilesPanel } from './navigatorfilespanel.js';
import { NavigatorMaterialsPanel } from './navigatormaterialspanel.js';
import { NavigatorMeshesPanel } from './navigatormeshespanel.js';
import { PanelSet } from './panelset.js';
import { InstallVerticalSplitter } from './utils.js';

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
    constructor (mainDiv, splitterDiv)
    {
        this.mainDiv = mainDiv;
        this.splitterDiv = splitterDiv;

        this.panelSet = new PanelSet (mainDiv);
        this.callbacks = null;
        this.selection = null;
        this.tempSelectedMeshId = null;

        this.filesPanel = new NavigatorFilesPanel (this.panelSet.GetContentDiv ());
        this.materialsPanel = new NavigatorMaterialsPanel (this.panelSet.GetContentDiv ());
        this.meshesPanel = new NavigatorMeshesPanel (this.panelSet.GetContentDiv ());

        this.panelSet.AddPanel (this.filesPanel);
        this.panelSet.AddPanel (this.materialsPanel);
        this.panelSet.AddPanel (this.meshesPanel);
        this.panelSet.ShowPanel (this.meshesPanel);
    }

    ShowPanels (show)
    {
        this.panelSet.ShowPanels (show);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;

        this.panelSet.Init ({
            onResize : () => {
                ShowDomElement (this.splitterDiv, this.panelSet.IsPanelsVisible ());
                this.callbacks.onResize ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            },
        });

        this.filesPanel.Init ({
            onFileBrowseButtonClicked : () => {
                this.callbacks.openFileBrowserDialog ();
            }
        });

        this.materialsPanel.Init ({
            onMaterialSelected : (materialIndex) => {
                this.SetSelection (new Selection (SelectionType.Material, materialIndex));
            },
            onMeshTemporarySelected : (meshInstanceId) => {
                this.tempSelectedMeshId = meshInstanceId;
                this.callbacks.updateMeshesSelection ();
            },
            onMeshSelected : (meshInstanceId) => {
                this.SetSelection (new Selection (SelectionType.Mesh, meshInstanceId));
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

        InstallVerticalSplitter (this.splitterDiv, this.mainDiv, false, () => {
            this.callbacks.onResize ();
        });
    }

    GetWidth ()
    {
        let navigatorWidth = GetDomElementOuterWidth (this.mainDiv);
        let splitterWidth = 0;
        if (this.panelSet.IsPanelsVisible ()) {
            splitterWidth = this.splitterDiv.offsetWidth;
        }
        return navigatorWidth + splitterWidth;
    }

    Resize (height)
    {
        SetDomElementOuterHeight (this.mainDiv, height);
        SetDomElementHeight (this.splitterDiv, height);
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

    ShowAllMeshes (show)
    {
        this.meshesPanel.ShowAllMeshes (show);
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

        this.callbacks.updateMeshesSelection ();
    }

    OnSelectionChanged ()
    {
        if (this.selection === null) {
            this.callbacks.onModelSelected ();
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

        let usedByMeshes = this.callbacks.getMeshesForMaterial (materialIndex);
        this.materialsPanel.UpdateMeshList (usedByMeshes);

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
