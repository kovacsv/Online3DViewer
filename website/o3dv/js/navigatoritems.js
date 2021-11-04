OV.MaterialItem = class extends OV.TreeViewButtonItem
{
    constructor (name, materialIndex, callbacks)
    {
        super (name);
        this.OnClick (() => {
            callbacks.onSelected (materialIndex);
        });
    }
};

OV.MeshItem = class extends OV.TreeViewButtonItem
{
    constructor (name, meshInstanceId, callbacks)
    {
        super (name);

        this.meshInstanceId = meshInstanceId;
        this.visible = true;

        this.fitToWindowButton = new OV.TreeViewButton ('fit');
        this.fitToWindowButton.OnClick (() => {
            callbacks.onFitToWindow (this.meshInstanceId);
        });
        this.AppendButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick (() => {
            callbacks.onShowHide (this.meshInstanceId);
        });
        this.AppendButton (this.showHideButton);

        this.OnClick (() => {
            callbacks.onSelected (this.meshInstanceId);
        });
    }

    GetMeshInstanceId ()
    {
        return this.meshInstanceId;
    }

    IsVisible ()
    {
        return this.visible;
    }

    SetVisible (visible)
    {
        this.visible = visible;
        if (this.visible) {
            this.showHideButton.SetImage ('visible');
        } else {
            this.showHideButton.SetImage ('hidden');
        }
        if (this.parent instanceof OV.NodeItem) {
            this.parent.UpdateVisibleStatus ();
        }
    }
};

OV.NodeItem = class extends OV.TreeViewGroupButtonItem
{
    constructor (name, icon, nodeId, callbacks)
    {
        super (name, icon);

        this.fitToWindowButton = new OV.TreeViewButton ('fit');
        this.fitToWindowButton.OnClick (() => {
            callbacks.onFitToWindow (nodeId);
        });
        this.AppendButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick (() => {
            callbacks.onShowHide (nodeId);
        });
        this.AppendButton (this.showHideButton);
    }

    IsVisible ()
    {
        let isVisible = false;
        this.EnumerateMeshItems ((meshItem) => {
            if (meshItem.IsVisible ()) {
                isVisible = true;
            }
        });
        return isVisible;
    }

    SetVisible (visible)
    {
        this.UpdateVisibleIcon (visible);
        for (let child of this.children) {
            if (child instanceof OV.NodeItem || child instanceof OV.MeshItem) {
                child.SetVisible (visible);
            }
        }
    }

    EnumerateMeshItems (processor)
    {
        for (let child of this.children) {
            if (child instanceof OV.NodeItem) {
                child.EnumerateMeshItems (processor);
            } else if (child instanceof OV.MeshItem) {
                processor (child);
            }
        }
    }

    UpdateVisibleStatus ()
    {
        let visible = this.IsVisible ();
        this.UpdateVisibleIcon (visible);
        if (this.parent instanceof OV.NodeItem) {
            this.parent.UpdateVisibleStatus ();
        }
    }

    UpdateVisibleIcon (visible)
    {
        if (visible) {
            this.showHideButton.SetImage ('visible');
        } else {
            this.showHideButton.SetImage ('hidden');
        }
    }
};

OV.NavigatorItems = class
{
    constructor ()
    {
        this.materialIndexToItem = new Map ();
        this.nodeIdToItem = new Map ();
        this.meshInstanceIdToItem = new Map ();
    }

    GetMaterialItem (materialIndex)
    {
        return this.materialIndexToItem.get (materialIndex);
    }

    AddMaterialItem (materialIndex, materialItem)
    {
        this.materialIndexToItem.set (materialIndex, materialItem);
    }

    MeshItemCount ()
    {
        return this.meshInstanceIdToItem.size;
    }

    GetNodeItem (nodeId)
    {
        return this.nodeIdToItem.get (nodeId);
    }

    AddNodeItem (nodeId, meshItem)
    {
        this.nodeIdToItem.set (nodeId, meshItem);
    }

    GetMeshItem (meshInstanceId)
    {
        return this.meshInstanceIdToItem.get (meshInstanceId.GetKey ());
    }

    AddMeshItem (meshInstanceId, meshItem)
    {
        this.meshInstanceIdToItem.set (meshInstanceId.GetKey (), meshItem);
    }

    EnumerateMeshItems (processor)
    {
        for (const meshItem of this.meshInstanceIdToItem.values ()) {
            if (!processor (meshItem)) {
                break;
            }
        }
    }

    Clear ()
    {
        this.materialIndexToItem = new Map ();
        this.nodeIdToItem = new Map ();
        this.meshInstanceIdToItem = new Map ();
    }
};
