import { GetDomElementOuterWidth, SetDomElementOuterHeight, SetDomElementOuterWidth } from '../engine/viewer/domutils.js';
import { PanelSet } from './panelset.js';
import { SidebarDetailsPanel } from './sidebardetailspanel.js';
import { SidebarSettingsPanel } from './sidebarsettingspanel.js';

export class Sidebar
{
    constructor (mainDiv, settings)
    {
        this.mainDiv = mainDiv;
        this.panelSet = new PanelSet (mainDiv);

        this.detailsPanel = new SidebarDetailsPanel (this.panelSet.GetContentDiv ());
        this.settingsPanel = new SidebarSettingsPanel (this.panelSet.GetContentDiv (), settings);

        this.panelSet.AddPanel (this.detailsPanel);
        this.panelSet.AddPanel (this.settingsPanel);
        this.panelSet.ShowPanel (this.detailsPanel);
    }

    IsPanelsVisible ()
    {
        return this.panelSet.IsPanelsVisible ();
    }

    ShowPanels (show)
    {
        this.panelSet.ShowPanels (show);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;

        this.panelSet.Init ({
            onResizeRequested : () => {
                this.callbacks.onResizeRequested ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            }
        });

        this.settingsPanel.Init ({
            getShadingType : () => {
                return this.callbacks.getShadingType ();
            },
            getCameraMode : () => {
                return this.callbacks.getCameraMode ();
            },
            hasDefaultMaterial : () => {
                return this.callbacks.hasDefaultMaterial ();
            },
            onEnvironmentMapChanged : () => {
                this.callbacks.onEnvironmentMapChanged ();
            },
            onBackgroundColorChanged : () => {
                this.callbacks.onBackgroundColorChanged ();
            },
            onDefaultColorChanged : () => {
                this.callbacks.onDefaultColorChanged ();
            },
            onEdgeDisplayChanged : () => {
                this.callbacks.onEdgeDisplayChanged ();
            }
        });
    }

    UpdateControlsStatus ()
    {
        this.settingsPanel.UpdateControlsStatus ();
    }

    UpdateControlsVisibility ()
    {
        this.settingsPanel.UpdateControlsVisibility ();
    }

    Resize (height)
    {
        SetDomElementOuterHeight (this.mainDiv, height);
        this.panelSet.Resize ();
    }

    GetWidth ()
    {
        return GetDomElementOuterWidth (this.mainDiv);
    }

    SetWidth (width)
    {
        SetDomElementOuterWidth (this.mainDiv, width);
    }

    Clear ()
    {
        this.panelSet.Clear ();
    }

    AddObject3DProperties (object3D)
    {
        this.detailsPanel.AddObject3DProperties (object3D);
    }

    AddMaterialProperties (material)
    {
        this.detailsPanel.AddMaterialProperties (material);
    }
}
