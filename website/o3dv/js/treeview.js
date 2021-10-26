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
        this.mainElement.click (clickHandler);
    }

    AddDomElements (parentDiv)
    {
        this.mainElement.appendTo (parentDiv);
    }
};

OV.TreeViewItem = class
{
    constructor (name)
    {
        this.name = name;
        this.mainElement = $('<div>').addClass ('ov_tree_item').attr ('title', this.name);
        this.nameElement = $('<div>').addClass ('ov_tree_item_name').html (this.name).appendTo (this.mainElement);
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
        this.parent = null;
        this.selected = false;
    }

    SetSelected (selected)
    {
        this.selected = selected;
        if (this.selected) {
            this.mainElement.addClass ('selected');
            this.parent.ShowChildren (true, () => {
                OV.ScrollToView (this.mainElement);
            });
        } else {
            this.mainElement.removeClass ('selected');
        }
    }

    SetParent (parent)
    {
        this.parent = parent;
    }
};

OV.TreeViewButtonItem = class extends OV.TreeViewSingleItem
{
    constructor (name)
    {
        super (name);
        this.onNameClick = null;

        this.mainElement.addClass ('clickable');
        this.buttonsDiv = $('<div>').addClass ('ov_tree_item_button_container').insertBefore (this.nameElement);
    }

    OnNameClick (onNameClick)
    {
        this.nameElement.css ('cursor', 'pointer');
        this.nameElement.click (onNameClick);
    }

    AddButton (button)
    {
        button.AddDomElements (this.buttonsDiv);
    }
};

OV.TreeViewGroupItem = class extends OV.TreeViewItem
{
    constructor (name, iconPath)
    {
        super (name);
        this.iconPath = iconPath;
        this.showChildren = false;

        this.childrenDiv = null;
        this.openButtonIcon = 'arrow_down';
        this.closeButtonIcon = 'arrow_up';

        OV.CreateSvgIcon (this.iconPath, 'ov_tree_item_icon').insertBefore (this.nameElement);
        let buttonContainer = $('<div>').addClass ('ov_tree_item_button_container').insertBefore (this.nameElement);
        this.openCloseButton = OV.AddSvgIcon (buttonContainer, this.openButtonIcon, 'ov_tree_item_button');
    }

    ShowChildren (show, onComplete)
    {
        this.showChildren = show;
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
            this.mainElement.addClass ('clickable');
            this.ShowChildren (this.showChildren, null);
            this.mainElement.click ((ev) => {
                this.showChildren = !this.showChildren;
                this.ShowChildren (this.showChildren, null);
            });
        }
        return this.childrenDiv;
    }

    AddChild (child)
    {
        this.CreateChildrenDiv ();
        child.SetParent (this);
        child.AddDomElements (this.childrenDiv);
    }
};

OV.TreeView = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_tree_view').appendTo (parentDiv);
    }

    AddItem (item)
    {
        item.AddDomElements (this.mainDiv);
    }

    Clear ()
    {
        this.mainDiv.empty ();
    }
};
