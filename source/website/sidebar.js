import { ShowDomElement, SetDomElementWidth, SetDomElementHeight, GetDomElementOuterWidth, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { FeatureSet } from './featureset.js';
import { PanelSet } from './panelset.js';
import { SidebarDetailsPanel } from './sidebardetailspanel.js';
import { SidebarMeasurePanel } from './sidebarmeasurepanel.js';
import { SidebarSettingsPanel } from './sidebarsettingspanel.js';
import { InstallVerticalSplitter } from './utils.js';

export class Sidebar
{
    constructor (mainDiv, splitterDiv, settings, measureTool)
    {
        this.mainDiv = mainDiv;
        this.splitterDiv = splitterDiv;
        this.panelSet = new PanelSet (mainDiv);

        this.detailsPanel = new SidebarDetailsPanel (this.panelSet.GetContentDiv ());
        this.settingsPanel = new SidebarSettingsPanel (this.panelSet.GetContentDiv (), settings);
        this.measurePanel = new SidebarMeasurePanel (this.panelSet.GetContentDiv (), measureTool);

        this.panelSet.AddPanel (this.detailsPanel);
        this.panelSet.AddPanel (this.settingsPanel);
        if (FeatureSet.MeasureTool) {
            this.panelSet.AddPanel (this.measurePanel);
        }
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
            onResize : () => {
                ShowDomElement (this.splitterDiv, this.panelSet.IsPanelsVisible ());
                this.callbacks.onResize ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            }
        });

        this.settingsPanel.Init ({
            onBackgroundColorChange : () => {
                this.callbacks.onBackgroundColorChange ();
            },
            onDefaultColorChange : () => {
                this.callbacks.onDefaultColorChange ();
            },
            onGridDisplayChange : () => {
                this.callbacks.onGridDisplayChange ();
            },
            onEdgeDisplayChange : () => {
                this.callbacks.onEdgeDisplayChange ();
            },
            onThemeChange : () => {
                this.callbacks.onThemeChange ();
            }
        });

        this.measurePanel.Init ({
            onActivatedChange : (isActivated) => {
                this.callbacks.onMeasureToolActivedChange (isActivated);
            }
        });

        InstallVerticalSplitter (this.splitterDiv, this.mainDiv, true, () => {
            this.callbacks.onResize ();
        });
    }

    UpdateSettings (hasDefaultMaterial)
    {
        this.settingsPanel.UpdateSettings (hasDefaultMaterial);
    }

    UpdateMeasureTool ()
    {
        this.measurePanel.UpdateMeasureTool ();
    }

    Resize (height)
    {
        SetDomElementOuterHeight (this.mainDiv, height);
        SetDomElementHeight (this.splitterDiv, height);
        this.panelSet.Resize ();
    }

    GetWidth ()
    {
        let sidebarWidth = GetDomElementOuterWidth (this.mainDiv);
        let splitterWidth = 0;
        if (this.panelSet.IsPanelsVisible ()) {
             splitterWidth = this.splitterDiv.offsetWidth;
        }
        return sidebarWidth + splitterWidth;
    }

    DecreaseWidth (diff)
    {
        let oldWidth = this.mainDiv.offsetWidth;
        SetDomElementWidth (this.mainDiv, oldWidth - diff);
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
