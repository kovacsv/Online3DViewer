OV.NavigatorPopupButton = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.callbacks = null;
        this.popup = null;

        this.button = OV.AddDiv (this.parentDiv, 'ov_navigator_info_button');
        this.buttonText = OV.AddDiv (this.button, 'ov_navigator_info_button_text');
        OV.AddSvgIconElement (this.button, 'arrow_right', 'ov_navigator_info_button_icon');
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
            this.popup.Hide ();
            this.popup = null;
        }
    }
};

OV.NavigatorPanel = class extends OV.Panel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.callbacks = null;

        this.titleDiv = OV.AddDiv (this.panelDiv, 'ov_navigator_tree_title');
        this.treeDiv = OV.AddDiv (this.panelDiv, 'ov_navigator_tree_panel ov_thin_scrollbar');
        this.treeView = new OV.TreeView (this.treeDiv);

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
};
