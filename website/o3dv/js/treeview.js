OV.ScrollToView = function (element)
{
    element[0].scrollIntoView ({
        behavior : 'smooth',
        block : 'nearest'
    });
};

OV.TreeViewButton = class
{
    constructor (imagePath)
    {
        this.imagePath = imagePath;
        this.mainElement = OV.CreateSvgIcon (this.imagePath, 'ov_tree_item_button');
        this.mainElement.attr ('src', this.imagePath);
    }

    SetImage (imagePath)
    {
        this.imagePath = imagePath;
        OV.SetSvgIconImage (this.mainElement, this.imagePath);
    }

    OnClick (clickHandler)
    {
        this.mainElement.click ((ev) => {
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
    constructor (name)
    {
        this.name = name;
        this.parent = null;
        this.mainElement = $('<div>').addClass ('ov_tree_item').attr ('title', this.name);
        this.nameElement = $('<div>').addClass ('ov_tree_item_name').html (this.name).appendTo (this.mainElement);
    }

    OnClick (onClick)
    {
        this.mainElement.addClass ('clickable');
        this.mainElement.css ('cursor', 'pointer');
        this.mainElement.click (onClick);
    }

    SetParent (parent)
    {
        this.parent = parent;
    }

    AddDomElements (parentDiv)
    {
        this.mainElement.appendTo (parentDiv);
    }
};

OV.TreeViewSingleItem = class extends OV.TreeViewItem
{
    constructor (name)
    {
        super (name);
        this.selected = false;
    }

    SetSelected (selected)
    {
        this.selected = selected;
        if (this.selected) {
            this.mainElement.addClass ('selected');
            let parent = this.parent;
            if (parent === null) {
                OV.ScrollToView (this.mainElement);
            } else {
                while (parent !== null) {
                    parent.ShowChildren (true, () => {
                        OV.ScrollToView (this.mainElement);
                    });
                    parent = parent.parent;
                }
            }
        } else {
            this.mainElement.removeClass ('selected');
        }
    }
};

OV.TreeViewButtonItem = class extends OV.TreeViewSingleItem
{
    constructor (name)
    {
        super (name);
        this.buttonsDiv = $('<div>').addClass ('ov_tree_item_button_container').insertBefore (this.nameElement);
    }

    AppendButton (button)
    {
        button.GetDomElement ().appendTo (this.buttonsDiv);
    }

    PrependButton (button)
    {
        button.GetDomElement ().prependTo (this.buttonsDiv);
    }
};

OV.TreeViewGroupItem = class extends OV.TreeViewItem
{
    constructor (name, iconPath)
    {
        super (name);
        this.children = [];
        this.isVisible = true;
        this.isChildrenVisible = false;

        this.childrenDiv = null;
        this.openButtonIcon = 'arrow_down';
        this.closeButtonIcon = 'arrow_right';

        this.openCloseButton = OV.CreateSvgIcon (this.openButtonIcon, 'ov_tree_item_icon').insertBefore (this.nameElement);
        if (OV.IsDefined (iconPath)) {
            OV.CreateSvgIcon (iconPath, 'ov_tree_item_icon').insertBefore (this.nameElement);
        }
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
            this.mainElement.show ();
            this.childrenDiv.addClass ('ov_tree_view_children');
        } else {
            this.mainElement.hide ();
            this.childrenDiv.removeClass ('ov_tree_view_children');
        }
    }

    ShowChildren (show, onComplete)
    {
        this.isChildrenVisible = show;
        if (this.childrenDiv === null) {
            return;
        }
        if (show) {
            OV.SetSvgIconImage (this.openCloseButton, this.openButtonIcon);
            this.childrenDiv.slideDown (400, onComplete);
        } else {
            OV.SetSvgIconImage (this.openCloseButton, this.closeButtonIcon);
            this.childrenDiv.slideUp (400, onComplete);
        }
    }

    CreateChildrenDiv ()
    {
        if (this.childrenDiv === null) {
            this.childrenDiv = $('<div>').addClass ('ov_tree_view_children').insertAfter (this.mainElement);
            this.Show (this.isVisible);
            this.ShowChildren (this.isChildrenVisible, null);
            this.OnClick ((ev) => {
                this.isChildrenVisible = !this.isChildrenVisible;
                this.ShowChildren (this.isChildrenVisible, null);
            });
        }
        return this.childrenDiv;
    }
};

OV.TreeViewGroupButtonItem = class extends OV.TreeViewGroupItem
{
    constructor (name, iconPath)
    {
        super (name, iconPath);
        this.buttonsDiv = $('<div>').addClass ('ov_tree_item_button_container').insertBefore (this.nameElement);
    }

    AppendButton (button)
    {
        button.GetDomElement ().appendTo (this.buttonsDiv);
    }

    PrependButton (button)
    {
        button.GetDomElement ().prependTo (this.buttonsDiv);
    }
};

OV.TreeView = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_tree_view').appendTo (parentDiv);
        this.children = [];
    }

    AddChild (child)
    {
        child.AddDomElements (this.mainDiv);
        this.children.push (child);
    }

    Clear ()
    {
        this.mainDiv.empty ();
        this.children = [];
    }
};
