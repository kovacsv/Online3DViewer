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
        this.AddButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick ((ev) => {
            callbacks.onShowHide (this.meshInstanceId);
        });
        this.AddButton (this.showHideButton);

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
    }
};

OV.NodeItem = class extends OV.TreeViewGroupButtonItem
{
    constructor (name, nodeId, callbacks)
    {
        super (name, null);

        this.fitToWindowButton = new OV.TreeViewButton ('fit');
        this.fitToWindowButton.OnClick (() => {
            callbacks.onFitToWindow (nodeId);
        });
        this.AddButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick (() => {
            callbacks.onShowHide (nodeId);
        });
        this.AddButton (this.showHideButton);
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

OV.NavigatorItems = class
{
    constructor ()
    {
        this.materialIndexToItem = new Map ();
        this.nodeIdToItem = new Map ();
        this.meshInstanceIdToItem = new Map ();
    }

    MaterialItemCount ()
    {
        return Object.keys (this.materialIndexToItem).length;
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
        return Object.keys (this.meshInstanceIdToItem).length;
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
        for (const meshItem of Object.values (this.meshInstanceIdToItem)) {
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
