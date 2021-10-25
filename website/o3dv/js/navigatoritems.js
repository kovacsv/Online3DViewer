OV.MaterialItem = class extends OV.TreeViewButtonItem
{
    constructor (name, originalIndex, callbacks)
    {
        super (name);
        this.originalIndex = originalIndex;
        this.OnNameClick (() => {
            callbacks.onSelected (this.originalIndex);
        });
    }
};

OV.MeshItem = class extends OV.TreeViewButtonItem
{
    constructor (name, originalIndex, callbacks)
    {
        super (name);
        
        this.originalIndex = originalIndex;
        this.visible = true;

        this.fitToWindowButton = new OV.TreeViewButton ('fit');
        this.fitToWindowButton.OnClick (() => {
            callbacks.onFitToWindow (this.originalIndex);
        });
        this.AddButton (this.fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('visible');
        this.showHideButton.OnClick ((ev) => {
            callbacks.onShowHide (this.originalIndex);
        });
        this.AddButton (this.showHideButton);

        this.OnNameClick (() => {
            callbacks.onSelected (this.originalIndex);
        });        
    }

    GetMeshIndex ()
    {
        return this.originalIndex;
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
        this.meshIndexToItem = {};
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
        return Object.keys (this.meshIndexToItem).length; 
    }

    GetMeshItem (meshIndex)
    {
        return this.meshIndexToItem[meshIndex];
    }

    AddMeshItem (meshIndex, meshItem)
    {
        this.meshIndexToItem[meshIndex] = meshItem;
    }

    EnumerateMeshItems (processor)
    {
        for (const meshItem of Object.values (this.meshIndexToItem)) {
            if (!processor (meshItem)) {
                break;
            }
        }
    }

    Clear ()
    {
        this.materialItems = {};
        this.meshItems = {};
    }
};
