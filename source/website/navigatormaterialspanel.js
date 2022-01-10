import { AddDiv, SetDomElementHeight, GetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { CalculatePopupPositionToElementBottomRight, ShowListPopup } from './dialogs.js';
import { MaterialItem } from './navigatoritems.js';
import { NavigatorPanel, NavigatorPopupButton } from './navigatorpanel.js';
import { GetMaterialName, GetMeshName } from './utils.js';

export class NavigatorMeshesPopupButton extends NavigatorPopupButton
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.meshInfoArray = null;
    }

    Update (meshInfoArray)
    {
        this.meshInfoArray = meshInfoArray;
        if (this.meshInfoArray === null) {
            return;
        }

        let meshesText = 'Meshes (' + this.meshInfoArray.length + ')';
        this.buttonText.innerHTML = meshesText;
    }

    OnButtonClick ()
    {
        if (this.meshInfoArray === null) {
            return;
        }

        let meshItems = [];
        for (let i = 0; i < this.meshInfoArray.length; i++) {
            let meshInfo = this.meshInfoArray[i];
            meshItems.push ({
                name : GetMeshName (meshInfo.name)
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
                const meshData = this.meshInfoArray[index];
                this.callbacks.onMeshHover (meshData.meshId);
            },
            onHoverStop : (index) => {
                this.callbacks.onMeshHover (null);
            },
            onClick : (index) => {
                const meshData = this.meshInfoArray[index];
                this.callbacks.onMeshSelected (meshData.meshId);
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

    UpdateMeshList (meshInfoArray)
    {
        this.meshesButton.Update (meshInfoArray);
    }
}
