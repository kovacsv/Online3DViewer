OV.MaterialItem = class extends OV.TreeViewButtonItem
{
    constructor (name, materialIndex, callbacks)
    {
        super (name);
        this.materialIndex = materialIndex;
        this.OnNameClick (() => {
            callbacks.onSelected (this.materialIndex);
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

        this.OnNameClick (() => {
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

OV.NavigatorItems = class
{
    constructor ()
    {
        this.materialIndexToItem = {};
        this.meshInstanceIdToItem = {};
    }

    MaterialItemCount ()
    {
        return Object.keys (this.materialIndexToItem).length;
    }

    GetMaterialItem (materialIndex)
    {
        return this.materialIndexToItem[materialIndex];
    }

    AddMaterialItem (materialIndex, materialItem)
    {
        this.materialIndexToItem[materialIndex] = materialItem;
    }

    MeshItemCount ()
    {
        return Object.keys (this.meshInstanceIdToItem).length;
    }

    GetMeshItem (meshInstanceId)
    {
        return this.meshInstanceIdToItem[meshInstanceId.GetKey ()];
    }

    AddMeshItem (meshInstanceId, meshItem)
    {
        this.meshInstanceIdToItem[meshInstanceId.GetKey ()] = meshItem;
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
        this.materialIndexToItem = {};
        this.meshInstanceIdToItem = {};
    }
};
