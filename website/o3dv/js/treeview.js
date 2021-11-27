OV.ScrollToView = function (element)
{
    element.scrollIntoView ({
        behavior : 'smooth',
        block : 'nearest'
    });
};

OV.TreeViewButton = class
{
    constructor (imagePath)
    {
        this.imagePath = imagePath;
        this.mainElement = OV.CreateSvgIconElement (this.imagePath, 'ov_tree_item_button');
        this.mainElement.setAttribute ('src', this.imagePath);
    }

    SetImage (imagePath)
    {
        this.imagePath = imagePath;
        OV.SetSvgIconImageElement (this.mainElement, this.imagePath);
    }

    OnClick (clickHandler)
    {
        this.mainElement.addEventListener ('click', (ev) => {
            ev.stopPropagation ();
            clickHandler (ev);
        });
    }

    GetDomElement ()
    {
        return this.mainElement;
    }
};

OV.TreeViewItem = class
{
    constructor (name, icon)
    {
        this.name = name;
        this.parent = null;
        this.mainElement = OV.CreateDiv ('ov_tree_item');
        this.mainElement.setAttribute ('title', this.name);
        this.nameElement = OV.AddDiv (this.mainElement, 'ov_tree_item_name', this.name);
        if (OV.IsDefined (icon)) {
            let iconElement = OV.CreateSvgIconElement (icon, 'ov_tree_item_icon');
            OV.InsertDomElementBefore (iconElement, this.nameElement);
        }
    }

    OnClick (onClick)
    {
        this.mainElement.classList.add ('clickable');
        this.mainElement.style.cursor = 'pointer';
        this.mainElement.addEventListener ('click', onClick);
    }

    SetParent (parent)
    {
        this.parent = parent;
    }

    AddDomElements (parentDiv)
    {
        parentDiv.appendChild (this.mainElement);
    }
};

OV.TreeViewSingleItem = class extends OV.TreeViewItem
{
    constructor (name, icon)
    {
        super (name, icon);
        this.selected = false;
    }

    SetSelected (selected)
    {
        this.selected = selected;
        if (this.selected) {
            this.mainElement.classList.add ('selected');
            let parent = this.parent;
            if (parent === null) {
                OV.ScrollToView (this.mainElement);
            } else {
                while (parent !== null) {
                    parent.ShowChildren (true);
                    OV.ScrollToView (this.mainElement);
                    parent = parent.parent;
                }
            }
        } else {
            this.mainElement.classList.remove ('selected');
        }
    }
};

OV.TreeViewButtonItem = class extends OV.TreeViewSingleItem
{
    constructor (name, icon)
    {
        super (name, icon);
        this.buttonsDiv = OV.CreateDiv ('ov_tree_item_button_container');
        OV.InsertDomElementBefore (this.buttonsDiv, this.nameElement);
    }

    AppendButton (button)
    {
        this.buttonsDiv.appendChild (button.GetDomElement ());
    }
};

OV.TreeViewGroupItem = class extends OV.TreeViewItem
{
    constructor (name, icon)
    {
        super (name, icon);
        this.children = [];
        this.isVisible = true;
        this.isChildrenVisible = false;

        this.childrenDiv = null;
        this.openButtonIcon = 'arrow_down';
        this.closeButtonIcon = 'arrow_right';

        this.openCloseButton = OV.CreateSvgIconElement (this.openButtonIcon, 'ov_tree_item_icon');
        OV.InsertDomElementBefore (this.openCloseButton, this.nameElement);
    }

    AddChild (child)
    {
        this.CreateChildrenDiv ();
        this.children.push (child);
        child.SetParent (this);
        child.AddDomElements (this.childrenDiv);
    }

    ExpandAll (expand)
    {
        for (let child of this.children) {
            if (child instanceof OV.TreeViewGroupItem) {
                child.ShowChildren (expand);
                child.ExpandAll (expand);
            }
        }
    }

    Show (show)
    {
        this.isVisible = show;
        if (this.childrenDiv === null) {
            return;
        }
        if (this.isVisible) {
            OV.ShowDomElement (this.mainElement);
            this.childrenDiv.classList.add ('ov_tree_view_children');
        } else {
            OV.HideDomElement (this.mainElement);
            this.childrenDiv.classList.remove ('ov_tree_view_children');
        }
    }

    ShowChildren (show)
    {
        this.isChildrenVisible = show;
        if (this.childrenDiv === null) {
            return;
        }
        if (show) {
            OV.SetSvgIconImageElement (this.openCloseButton, this.openButtonIcon);
            OV.ShowDomElement (this.childrenDiv);
        } else {
            OV.SetSvgIconImageElement (this.openCloseButton, this.closeButtonIcon);
            OV.HideDomElement (this.childrenDiv);
        }
    }

    CreateChildrenDiv ()
    {
        if (this.childrenDiv === null) {
            this.childrenDiv = OV.CreateDiv ('ov_tree_view_children');
            OV.InsertDomElementAfter (this.childrenDiv, this.mainElement);
            this.Show (this.isVisible);
            this.ShowChildren (this.isChildrenVisible);
            this.OnClick ((ev) => {
                this.isChildrenVisible = !this.isChildrenVisible;
                this.ShowChildren (this.isChildrenVisible);
            });
        }
        return this.childrenDiv;
    }
};

OV.TreeViewGroupButtonItem = class extends OV.TreeViewGroupItem
{
    constructor (name, icon)
    {
        super (name, icon);
        this.buttonsDiv = OV.CreateDiv ('ov_tree_item_button_container');
        OV.InsertDomElementBefore (this.buttonsDiv, this.nameElement);
    }

    AppendButton (button)
    {
        this.buttonsDiv.appendChild (button.GetDomElement ());
    }
};

OV.TreeView = class
{
    constructor (parentDiv)
    {
        this.mainDiv = OV.AddDiv (parentDiv, 'ov_tree_view');
        this.children = [];
    }

    AddClass (className)
    {
        this.mainDiv.classList.add (className);
    }

    AddChild (child)
    {
        child.AddDomElements (this.mainDiv);
        this.children.push (child);
    }

    Clear ()
    {
        OV.ClearDomElement (this.mainDiv);
        this.children = [];
    }
};
