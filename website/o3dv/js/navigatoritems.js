OV.NavigatorItemRecurse =
{
    No : 0,
    Parents : 1,
    Children : 2,
    All : 3
};

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
    constructor (name, icon, meshInstanceId, callbacks)
    {
        super (name, icon);

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

    SetVisible (visible, recurse)
    {
        if (this.visible === visible) {
            return;
        }
        this.visible = visible;
        if (this.visible) {
            this.showHideButton.SetImage ('visible');
        } else {
            this.showHideButton.SetImage ('hidden');
        }
        if (recurse === OV.NavigatorItemRecurse.Parents) {
            if (this.parent instanceof OV.NodeItem) {
                let parentIsVisible = this.parent.CalculateIsVisible ();
                this.parent.SetVisible (parentIsVisible, OV.NavigatorItemRecurse.Parents);
            }
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
        this.visible = true;

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
        return this.visible;
    }

    CalculateIsVisible ()
    {
        let isVisible = false;
        for (let child of this.children) {
            if (child instanceof OV.NodeItem || child instanceof OV.MeshItem) {
                if (child.IsVisible ()) {
                    isVisible = true;
                    break;
                }
            }
        }
        return isVisible;
    }

    SetVisible (visible, recurse)
    {
        if (this.visible === visible) {
            return;
        }
        this.visible = visible;
        if (this.visible) {
            this.showHideButton.SetImage ('visible');
        } else {
            this.showHideButton.SetImage ('hidden');
        }
        if (OV.IsDefined (this.callbacks.onVisibilityChanged)) {
            this.callbacks.onVisibilityChanged (this.visible);
        }
        if (recurse === OV.NavigatorItemRecurse.Children || recurse === OV.NavigatorItemRecurse.All) {
            for (let child of this.children) {
                if (child instanceof OV.NodeItem || child instanceof OV.MeshItem) {
                    child.SetVisible (this.visible, OV.NavigatorItemRecurse.Children);
                }
            }
        }
        if (recurse === OV.NavigatorItemRecurse.Parents || recurse === OV.NavigatorItemRecurse.All) {
            if (this.parent instanceof OV.NodeItem) {
                let parentIsVisible = this.parent.CalculateIsVisible ();
                this.parent.SetVisible (parentIsVisible, OV.NavigatorItemRecurse.Parents);
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
};
