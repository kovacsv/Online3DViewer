OV.Sidebar = class
{
    constructor (mainDiv, splitterDiv)
    {
        this.mainDiv = mainDiv;
        this.splitterDiv = splitterDiv;
        this.panelSet = new OV.PanelSet (mainDiv);

        this.detailsPanel = new OV.DetailsSidebarPanel (this.panelSet.GetContentDiv ());
        this.settingsPanel = new OV.SettingsSidebarPanel (this.panelSet.GetContentDiv ());

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

    Init (settings, callbacks)
    {
        this.callbacks = callbacks;

        this.panelSet.Init ({
            onResize : () => {
                if (this.panelSet.IsPanelsVisible ()) {
                    this.splitterDiv.show ();
                } else {
                    this.splitterDiv.hide ();
                }
                this.callbacks.onResize ();
            },
            onShowHidePanels : (show) => {
                this.callbacks.onShowHidePanels (show);
            }
        });

        let defaultSettings = new OV.Settings ();
        this.settingsPanel.InitSettings (
            settings,
            defaultSettings,
            {
                onBackgroundColorChange : (newVal) => {
                    this.callbacks.onBackgroundColorChange (newVal);
                },
                onDefaultColorChange : (newVal) => {
                    this.callbacks.onDefaultColorChange (newVal);
                },
                onThemeChange : (newVal) => {
                    this.callbacks.onThemeChange (newVal);
                }
            }
        );

        OV.InstallVerticalSplitter (this.splitterDiv, this.mainDiv, true, () => {
            this.callbacks.onResize ();
        });
    }

    Update (model)
    {
        this.settingsPanel.Update (model);
    }

    Resize (height)
    {
        this.mainDiv.outerHeight (height, true);
        this.splitterDiv.outerHeight (height, true);
        this.panelSet.Resize ();
    }

    GetWidth ()
    {
        let sidebarWidth = parseInt (this.mainDiv.outerWidth (true), 10);
        let splitterWidth = 0;
        if (this.panelSet.IsPanelsVisible ()) {
             splitterWidth = parseInt (this.splitterDiv.outerWidth (true), 10);
        }
        return sidebarWidth + splitterWidth;
    }

    DecreaseWidth (diff)
    {
        let oldWidth = this.mainDiv.outerWidth (true);
        this.mainDiv.outerWidth (oldWidth - diff, true);
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
