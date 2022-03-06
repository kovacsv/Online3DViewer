import { AddDiv } from '../engine/viewer/domutils.js';
import { Panel } from './panelset.js';
import { TreeView } from './treeview.js';
import { AddSvgIconElement } from './utils.js';

export class NavigatorPopupButton
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.callbacks = null;
        this.popup = null;

        this.button = AddDiv (this.parentDiv, 'ov_panel_button');
        this.buttonText = AddDiv (this.button, 'ov_panel_button_text');
        AddSvgIconElement (this.button, 'arrow_right', 'ov_panel_button_icon');
        this.button.addEventListener ('click', () => {
            this.OnButtonClick ();
        });
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    OnButtonClick ()
    {

    }

    Clear ()
    {
        if (this.popup !== null) {
            this.popup.Close ();
            this.popup = null;
        }
    }
}

export class NavigatorPanel extends Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = AddDiv (this.panelDiv, 'ov_navigator_tree_title');
        this.treeDiv = AddDiv (this.panelDiv, 'ov_navigator_tree_panel ov_thin_scrollbar');
        this.treeView = new TreeView (this.treeDiv);

        let panelName = this.GetName ();
        this.titleDiv.innerHTML = panelName;
        this.titleDiv.setAttribute ('title', panelName);
    }

    Clear ()
    {
        this.treeView.Clear ();
    }

    GetName ()
    {
        return null;
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }

    Fill (importResult)
    {

    }
}
