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
        this.domElement.attr ('src', this.imagePath);
    }

    OnClick (clickHandler)
    {
        this.clickHandler = clickHandler;
    }

    CreateDomElement (parentDiv)
    {
        this.domElement = $('<img>').addClass ('ov_tree_menu_item_button').appendTo (parentDiv);
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
        this.mainElement = $('<div>').addClass ('ov_tree_menu_item').attr ('title', this.name).appendTo (parentDiv);
    }
    
    CreateNameElement ()
    {
        this.nameElement = $('<div>').addClass ('ov_tree_menu_item_name').html (this.name).appendTo (this.mainElement);
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
            let obj = this;
            this.mainElement.addClass ('selected');
            this.parent.ShowChildren (true, function () {
                OV.ScrollToView (obj.mainElement);
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
        let buttonContainer = $('<div>').addClass ('ov_tree_menu_item_button_container').appendTo (this.mainElement);
        for (let i = 0; i < this.buttons.length; i++) {
            let button = this.buttons[i];
            button.CreateDomElement (buttonContainer);
        }
        this.CreateNameElement ();
        if (this.onNameClick !== null) {
            let obj = this;
            this.nameElement.css ('cursor', 'pointer');
            this.nameElement.click (function (ev) {
                obj.onNameClick ();
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
        this.openButtonPath = 'assets/images/tree/arrow_down.svg';
        this.closeButtonPath = 'assets/images/tree/arrow_up.svg';
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
            this.openCloseButton.attr ('src', this.openButtonPath);
            if (this.animated) {
                this.childrenDiv.slideDown (400, onComplete);
            } else {
                this.childrenDiv.show ();
                if (onComplete) {
                    onComplete ();
                }
            }
        } else {
            this.openCloseButton.attr ('src', this.closeButtonPath);
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
            let obj = this;
            this.childrenDiv = $('<div>').addClass ('ov_tree_menu_children').insertAfter (this.mainElement);
            this.mainElement.addClass ('clickable');
            this.ShowChildren (this.showChildren, null);
            this.mainElement.click (function (ev) {
                obj.showChildren = !obj.showChildren;
                obj.ShowChildren (obj.showChildren, null);
                if (obj.openCloseHandler !== null) {
                    obj.openCloseHandler ();
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
        $('<img>').addClass ('ov_tree_menu_item_icon').attr ('src', this.iconPath).appendTo (this.mainElement);
        let buttonContainer = $('<div>').addClass ('ov_tree_menu_item_button_container').appendTo (this.mainElement);
        this.openCloseButton = $('<img>').addClass ('ov_tree_menu_item_button').attr ('src', this.openButtonPath).appendTo (buttonContainer);
        this.CreateNameElement ();
    }
};

OV.TreeView = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_tree_menu').appendTo (parentDiv);
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
