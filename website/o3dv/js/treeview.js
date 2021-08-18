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
        this.domElement = null;
        this.clickHandler = null;
    }

    SetImage (imagePath)
    {
        this.imagePath = imagePath;
        OV.SetSvgIconImage (this.domElement, this.imagePath);
    }

    OnClick (clickHandler)
    {
        this.clickHandler = clickHandler;
    }

    CreateDomElement (parentDiv)
    {
        this.domElement = OV.CreateSvgIcon (parentDiv, this.imagePath, 'ov_tree_item_button');
        this.domElement.attr ('src', this.imagePath);
        if (this.clickHandler !== null) {
            this.domElement.click (this.clickHandler);
        }
    }
};

OV.TreeViewItem = class
{
    constructor (name)
    {
        this.name = name;
        this.mainElement = null;
        this.nameElement = null;
    }

    GetName ()
    {
        return this.name;
    }
    
    SetName (name)
    {
        this.name = name;
    }

    CreateMainElement (parentDiv)
    {
        this.mainElement = $('<div>').addClass ('ov_tree_item').attr ('title', this.name).appendTo (parentDiv);
    }
    
    CreateNameElement ()
    {
        this.nameElement = $('<div>').addClass ('ov_tree_item_name').html (this.name).appendTo (this.mainElement);
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

    CreateDomElement (parentDiv)
    {
        this.CreateMainElement (parentDiv);
        this.CreateNameElement ();
    }
};

OV.TreeViewButtonItem = class extends OV.TreeViewSingleItem
{
    constructor (name)
    {
        super (name);
        this.buttons = [];
        this.onNameClick = null;
    }

    OnNameClick (onNameClick)
    {
        this.onNameClick = onNameClick;
    }

    AddButton (button)
    {
        this.buttons.push (button);
    }

    CreateDomElement (parentDiv)
    {
        this.CreateMainElement (parentDiv);
        this.mainElement.addClass ('clickable');
        let buttonContainer = $('<div>').addClass ('ov_tree_item_button_container').appendTo (this.mainElement);
        for (let i = 0; i < this.buttons.length; i++) {
            let button = this.buttons[i];
            button.CreateDomElement (buttonContainer);
        }
        this.CreateNameElement ();
        if (this.onNameClick !== null) {
            this.nameElement.css ('cursor', 'pointer');
            this.nameElement.click ((ev) => {
                this.onNameClick ();
            });
        }
    }
};

OV.TreeViewGroupItem = class extends OV.TreeViewItem
{
    constructor (name, iconPath)
    {
        super (name);
        this.iconPath = iconPath;
        this.childrenDiv = null;
        this.showChildren = false;
        this.openCloseButton = null;
        this.openButtonIcon = 'arrow_down';
        this.closeButtonIcon = 'arrow_up';
        this.animated = true;
        this.openCloseHandler = null;
    }

    GetName ()
    {
        return this.name;
    }
    
    SetName (name)
    {
        this.name = name;
    }

    SetAnimated (animated)
    {
        this.animated = animated;
    }

    SetOpenCloseHandler (openCloseHandler)
    {
        this.openCloseHandler = openCloseHandler;
    }

    ShowChildren (show, onComplete)
    {
        this.showChildren = show;
        if (this.childrenDiv === null) {
            return;
        }
        if (show) {
            OV.SetSvgIconImage (this.openCloseButton, this.openButtonIcon);
            if (this.animated) {
                this.childrenDiv.slideDown (400, onComplete);
            } else {
                this.childrenDiv.show ();
                if (onComplete) {
                    onComplete ();
                }
            }
        } else {
            OV.SetSvgIconImage (this.openCloseButton, this.closeButtonIcon);
            if (this.animated) {
                this.childrenDiv.slideUp (400, onComplete);
            } else {
                this.childrenDiv.hide ();
                if (onComplete) {
                    onComplete ();
                }
            }
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
                if (this.openCloseHandler !== null) {
                    this.openCloseHandler ();
                }
            });
        }
        return this.childrenDiv;
    }

    GetChildrenDiv ()
    {
        return this.childrenDiv;
    }

    AddChild (child)
    {
        this.CreateChildrenDiv ();
        child.SetParent (this);
        child.CreateDomElement (this.childrenDiv);
    }

    CreateDomElement (parentDiv)
    {
        this.CreateMainElement (parentDiv);
        OV.CreateSvgIcon (this.mainElement, this.iconPath, 'ov_tree_item_icon');
        let buttonContainer = $('<div>').addClass ('ov_tree_item_button_container').appendTo (this.mainElement);
        this.openCloseButton = OV.CreateSvgIcon (buttonContainer, this.openButtonIcon, 'ov_tree_item_button');
        this.CreateNameElement ();
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
        item.CreateDomElement (this.mainDiv);
    }

    Clear ()
    {
        this.mainDiv.empty ();
    }
};
