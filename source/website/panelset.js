import { AddDiv, ShowDomElement, IsDomElementVisible, SetDomElementWidth, SetDomElementHeight } from '../engine/viewer/domutils.js';
import { AddSvgIconElement, SetSvgIconImageElement } from './utils.js';

export class Panel
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.panelDiv = AddDiv (parentDiv);
        ShowDomElement (this.panelDiv, false);
        this.visible = false;
    }

    GetName ()
    {
        return null;
    }

    GetIcon ()
    {
        return null;
    }

    IsVisible ()
    {
        return this.visible;
    }

    Show (show)
    {
        if (this.visible === show) {
            return;
        }

        this.visible = show;
        ShowDomElement (this.panelDiv, this.visible);
    }

    Resize ()
    {

    }

    Clear ()
    {

    }
}

export class PanelSet
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.menuDiv = AddDiv (parentDiv, 'ov_panel_set_menu');
        this.contentDiv = AddDiv (parentDiv, 'ov_panel_set_content ov_thin_scrollbar');
        this.panels = [];
        this.panelButtons = [];
        this.panelsVisible = true;
        this.panelsPrevWidth = null;
        this.callbacks = null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    GetContentDiv ()
    {
        return this.contentDiv;
    }

    AddPanel (panel)
    {
        this.panels.push (panel);
        let button = AddSvgIconElement (this.menuDiv, panel.GetIcon (), 'ov_panel_set_menu_button');
        button.setAttribute ('alt', panel.GetName ());
        button.setAttribute ('title', panel.GetName ());
        this.panelButtons.push (button);
        button.addEventListener ('click', () => {
            if (panel === this.GetVisiblePanel ()) {
                this.ShowPanels (false);
            } else {
                this.ShowPanels (true);
                this.ShowPanel (panel);
            }
        });
    }

    IsPanelsVisible ()
    {
        return this.panelsVisible;
    }

    ShowPanels (show)
    {
        if (!this.IsParentVisible ()) {
            return;
        }

        if (this.panelsVisible === show) {
            return;
        }

        this.panelsVisible = show;
        if (this.panelsVisible) {
            ShowDomElement (this.contentDiv, true);
            SetDomElementWidth (this.parentDiv, this.menuDiv.offsetWidth + this.panelsPrevWidth);
        } else {
            for (let panelButton of this.panelButtons) {
                panelButton.classList.remove ('selected');
            }
            for (let panel of this.panels) {
                panel.Show (false);
            }
            this.panelsPrevWidth = this.contentDiv.offsetWidth;
            SetDomElementWidth (this.parentDiv, this.menuDiv.offsetWidth);
            ShowDomElement (this.contentDiv, false);
        }

        this.callbacks.onShowHidePanels (this.panelsVisible);
        this.callbacks.onResizeRequested ();
    }

    ShowPanel (panel)
    {
        if (panel === this.GetVisiblePanel ()) {
            return;
        }

        let panelButton = this.GetPanelButton (panel);
        for (let otherPanelButton of this.panelButtons) {
            if (otherPanelButton !== panelButton) {
                otherPanelButton.classList.remove ('selected');
            }
        }
        panelButton.classList.add ('selected');

        for (let otherPanel of this.panels) {
            if (otherPanel !== panel) {
                otherPanel.Show (false);
            }
        }
        panel.Show (true);
        panel.Resize ();
    }

    GetVisiblePanel ()
    {
        if (!this.panelsVisible) {
            return null;
        }
        for (let panel of this.panels) {
            if (panel.IsVisible ()) {
                return panel;
            }
        }
        return null;
    }

    SetPanelIcon (panel, icon)
    {
        let panelButton = this.GetPanelButton (panel);
        SetSvgIconImageElement (panelButton, icon);
    }

    GetPanelButton (panel)
    {
        const panelIndex = this.panels.indexOf (panel);
        return this.panelButtons[panelIndex];
    }

    Resize ()
    {
        let height = this.parentDiv.offsetHeight;
        SetDomElementHeight (this.menuDiv, height);
        SetDomElementHeight (this.contentDiv, height);
        if (this.panelsVisible) {
            for (let panel of this.panels) {
                if (panel.IsVisible ()) {
                    panel.Resize ();
                }
            }
        }
    }

    IsParentVisible ()
    {
        return IsDomElementVisible (this.parentDiv);
    }

    Clear ()
    {
        for (let panel of this.panels) {
            panel.Clear ();
        }
    }
}
