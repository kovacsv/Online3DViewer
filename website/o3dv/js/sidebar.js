OV.Sidebar = class
{
    constructor (mainDiv, splitterDiv, settings, measureTool)
    {
        this.mainDiv = mainDiv;
        this.splitterDiv = splitterDiv;
        this.panelSet = new OV.PanelSet (mainDiv);

        this.detailsPanel = new OV.SidebarDetailsPanel (this.panelSet.GetContentDiv ());
        this.settingsPanel = new OV.SidebarSettingsPanel (this.panelSet.GetContentDiv (), settings);
        this.measurePanel = new OV.SidebarMeasurePanel (this.panelSet.GetContentDiv (), measureTool);

        this.panelSet.AddPanel (this.detailsPanel);
        this.panelSet.AddPanel (this.settingsPanel);
        if (OV.FeatureSet.MeasureTool) {
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
                OV.ShowDomElement (this.splitterDiv, this.panelSet.IsPanelsVisible ());
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

        OV.InstallVerticalSplitter (this.splitterDiv, this.mainDiv, true, () => {
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
        OV.SetDomElementOuterHeight (this.mainDiv, height);
        OV.SetDomElementHeight (this.splitterDiv, height);
        this.panelSet.Resize ();
    }

    GetWidth ()
    {
        let sidebarWidth = OV.GetDomElementOuterWidth (this.mainDiv);
        let splitterWidth = 0;
        if (this.panelSet.IsPanelsVisible ()) {
             splitterWidth = this.splitterDiv.offsetWidth;
        }
        return sidebarWidth + splitterWidth;
    }

    DecreaseWidth (diff)
    {
        let oldWidth = this.mainDiv.offsetWidth;
        OV.SetDomElementWidth (this.mainDiv, oldWidth - diff);
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
};
