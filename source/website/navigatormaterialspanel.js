import { AddDiv, SetDomElementHeight, GetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToElementBottomRight, ShowListPopup } from './dialogs.js';
import { MaterialItem } from './navigatoritems.js';
import { NavigatorPanel, NavigatorPopupButton } from './navigatorpanel.js';
import { GetMaterialName, GetMeshName } from './utils.js';

class NavigatorMeshesPopupButton extends NavigatorPopupButton
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.meshInstanceArray = null;
    }

    Update (meshInstanceArray)
    {
        this.meshInstanceArray = meshInstanceArray;
        if (this.meshInstanceArray === null) {
            return;
        }

        let meshesText = 'Meshes (' + this.meshInstanceArray.length + ')';
        this.buttonText.innerHTML = meshesText;
    }

    OnButtonClick ()
    {
        if (this.meshInstanceArray === null) {
            return;
        }

        let meshItems = [];
        for (let i = 0; i < this.meshInstanceArray.length; i++) {
            let meshInstance = this.meshInstanceArray[i];
            meshItems.push ({
                name : GetMeshName (meshInstance.node.GetName (), meshInstance.mesh.GetName ())
            });
        }

        if (meshItems.length === 0) {
            return;
        }

        this.popup = ShowListPopup (meshItems, {
            calculatePosition : (contentDiv) => {
                return CalculatePopupPositionToElementBottomRight (this.button, contentDiv);
            },
            onHoverStart : (index) => {
                const meshInstance = this.meshInstanceArray[index];
                this.callbacks.onMeshHover (meshInstance.id);
            },
            onHoverStop : (index) => {
                this.callbacks.onMeshHover (null);
            },
            onClick : (index) => {
                const meshInstance = this.meshInstanceArray[index];
                this.callbacks.onMeshSelected (meshInstance.id);
            }
        });
    }
}

export class NavigatorMaterialsPanel extends NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;
        this.materialIndexToItem = new Map ();

        this.popupDiv = AddDiv (this.panelDiv, 'ov_navigator_info_panel');
        this.meshesButton = new NavigatorMeshesPopupButton (this.popupDiv);
    }

    GetName ()
    {
        return 'Materials';
    }

    GetIcon ()
    {
        return 'materials';
    }

    Resize ()
    {
        let titleHeight = GetDomElementOuterHeight (this.titleDiv);
        let popupHeight = GetDomElementOuterHeight (this.popupDiv);
        let height = this.parentDiv.offsetHeight;
        SetDomElementHeight (this.treeDiv, height - titleHeight - popupHeight);
    }

    Clear ()
    {
        super.Clear ();
        this.meshesButton.Clear ();
        this.materialIndexToItem = new Map ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.meshesButton.Init ({
            onMeshHover : (meshInstanceId) => {
                this.callbacks.onMeshTemporarySelected (meshInstanceId);
            },
            onMeshSelected : (meshInstanceId) => {
                this.callbacks.onMeshSelected (meshInstanceId);
            }
        });
    }

    Fill (importResult)
    {
        super.Fill (importResult);
        const model = importResult.model;
        for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
            let material = model.GetMaterial (materialIndex);
            let materialName = GetMaterialName (material.name);
            let materialItem = new MaterialItem (materialName, materialIndex, {
                onSelected : (materialIndex) => {
                    this.callbacks.onMaterialSelected (materialIndex);
                }
            });
            this.materialIndexToItem.set (materialIndex, materialItem);
            this.treeView.AddChild (materialItem);
        }
    }

    GetMaterialItem (materialIndex)
    {
        return this.materialIndexToItem.get (materialIndex);
    }

    SelectMaterialItem (materialIndex, isSelected)
    {
        this.GetMaterialItem (materialIndex).SetSelected (isSelected);
    }

    UpdateMeshList (meshInstanceArray)
    {
        this.meshesButton.Update (meshInstanceArray);
    }
}
