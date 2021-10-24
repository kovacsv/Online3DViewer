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

OV.NavigatorTree = class
{
    constructor ()
    {
        this.meshItems = [];
        this.materialItems = [];
    }

    MaterialCount ()
    {
        return this.materialItems.length;
    }

    GetMaterialItem (index)
    {
        return this.materialItems[index];
    }

    AddMaterialItem (materialItem)
    {
        this.materialItems.push (materialItem);
    }

    MeshCount ()
    {
        return this.meshItems.length;
    }

    GetMeshItem (index)
    {
        return this.meshItems[index];
    }

    AddMeshItem (meshItem)
    {
        this.meshItems.push (meshItem);
    }

    Clear ()
    {
        this.meshItems = [];
        this.materialItems = [];
    }
};
