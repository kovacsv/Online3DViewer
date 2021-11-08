OV.MaterialItem = class extends OV.TreeViewSingleItem
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
    constructor (name, nodeId, callbacks)
    {
        super (name, null);
        this.nodeId = nodeId;
        this.callbacks = callbacks;

        this.fitToWindowButton = new OV.TreeViewButton ('fit');
        this.fitToWindowButton.OnClick (() => {
            this.callbacks.onFitToWindow (nodeId);
        });
        this.AppendButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick (() => {
            this.callbacks.onShowHide (nodeId);
        });
        this.AppendButton (this.showHideButton);
    }

    GetNodeId ()
    {
        return this.nodeId;
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
        if (OV.IsDefined (this.callbacks.onVisibilityChanged)) {
            this.callbacks.onVisibilityChanged (visible);
        }
    }
};
