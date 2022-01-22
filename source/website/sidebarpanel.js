import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { Panel } from './panelset.js';

export class SidebarPanel extends Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = null;
        if (this.HasTitle ()) {
            this.titleDiv = AddDiv (this.panelDiv, 'ov_sidebar_title');
            AddDiv (this.titleDiv, 'ov_sidebar_title_text', this.GetName ());
            this.titleDiv.setAttribute ('title', this.GetName ());
        }

        this.contentDiv = AddDiv (this.panelDiv, 'ov_sidebar_content ov_thin_scrollbar');
    }

    GetName ()
    {
        return null;
    }

    HasTitle ()
    {
        return true;
    }

    Clear ()
    {
        ClearDomElement (this.contentDiv);
    }

    Init (callbacks)
    {
        this.callbacks = callbacks;
    }
}
