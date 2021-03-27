OV.MaterialData = class
{
    constructor (originalIndex)
    {
        this.originalIndex = originalIndex;
        this.menuItem = null;
    }

    SetSelected (selected)
    {
        this.menuItem.SetSelected (selected);
    }    

    CreateMenuItem (name, callbacks)
    {
        let obj = this;
        this.menuItem = new OV.TreeViewButtonItem (name);
        this.menuItem.OnNameClick (function () {
            callbacks.onSelected (obj.originalIndex);
        });
        return this.menuItem;
    }    
};

OV.MeshData = class
{
    constructor (originalIndex)
    {
        this.originalIndex = originalIndex;
        this.visible = true;
        this.menuItem = null;
        this.showHideButton = null;
    }

    IsVisible ()
    {
        return this.visible;
    }

    SetVisible (visible)
    {
        this.visible = visible;
        if (this.visible) {
            this.showHideButton.SetImage ('assets/images/tree/visible.svg');
        } else {
            this.showHideButton.SetImage ('assets/images/tree/hidden.svg');
        }
    }

    SetSelected (selected)
    {
        this.menuItem.SetSelected (selected);
    }

    CreateMenuItem (name, callbacks)
    {
        let obj = this;
        this.menuItem = new OV.TreeViewButtonItem (name);

        let fitToWindowButton = new OV.TreeViewButton ('assets/images/tree/fit_tree.svg');
        fitToWindowButton.OnClick (function () {
            callbacks.onFitToWindow (obj.originalIndex);
        });
        this.menuItem.AddButton (fitToWindowButton);

        this.showHideButton = new OV.TreeViewButton ('assets/images/tree/visible.svg');
        this.showHideButton.OnClick (function (ev) {
            if (ev.ctrlKey || ev.metaKey) {
                callbacks.onIsolate (obj.originalIndex);
            } else {
                callbacks.onShowHide (obj.originalIndex);
            }
        });
        this.menuItem.AddButton (this.showHideButton);

        this.menuItem.OnNameClick (function () {
            callbacks.onSelected (obj.originalIndex);
        });

        return this.menuItem;
    }
};

OV.ModelData = class
{
    constructor ()
    {
        this.meshDataArr = [];
        this.materialDataArr = [];
    }

    MaterialCount ()
    {
        return this.materialDataArr.length;
    }

    GetMaterialData (index)
    {
        return this.materialDataArr[index];
    }

    AddMaterialData (materialData)
    {
        this.materialDataArr.push (materialData);
    }

    MeshCount ()
    {
        return this.meshDataArr.length;
    }

    GetMeshData (index)
    {
        return this.meshDataArr[index];
    }

    AddMeshData (meshData)
    {
        this.meshDataArr.push (meshData);
    }

    Clear ()
    {
        this.meshDataArr = [];
        this.materialDataArr = [];
    }
};
