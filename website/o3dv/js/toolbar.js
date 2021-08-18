OV.ToolbarButton = class
{
    constructor (image, imageTitle, onClick)
    {
        this.image = image;
        this.imageTitle = imageTitle;
        this.onClick = onClick;
        this.selected = false;
        this.buttonDiv = null;
        this.buttonImg = null;
    }

    CreateDomElement (parentDiv)
    {
        this.buttonDiv = $('<div>').addClass ('ov_toolbar_button').appendTo (parentDiv);
        this.buttonImg = OV.CreateSvgIcon (this.buttonDiv, this.image);
        if (this.onClick !== null) {
            this.buttonDiv.click (this.onClick);
        }
        this.buttonDiv.attr ('alt', this.imageTitle);
        OV.InstallTooltip (this.buttonDiv, this.imageTitle);
    }

    AddClass (className)
    {
        this.buttonDiv.addClass (className);
    }

    RemoveClass (className)
    {
        this.buttonDiv.removeClass (className);
    }

    AddImageClass (className)
    {
        this.buttonImg.addClass (className);
    }

    RemoveImageClass (className)
    {
        this.buttonImg.removeClass (className);
    }

    SetSelected (selected)
    {
        this.selected = selected;
        if (!this.selected) {
            this.buttonDiv.removeClass ('selected');
        } else {
            this.buttonDiv.addClass ('selected');
        }        
    }
};

OV.Toolbar = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_toolbar').appendTo (parentDiv);
    }

    AddImageButton (image, imageTitle, onClick)
    {
        let button = new OV.ToolbarButton (image, imageTitle, onClick);
        button.CreateDomElement (this.mainDiv);
        return button;
    }

    AddImageRadioButton (buttonData, selectedIndex, onClick)
    {
        let buttons = [];
        for (let buttonIndex = 0; buttonIndex < buttonData.length; buttonIndex++) {
            let data = buttonData[buttonIndex];
            let button = this.AddImageButton (data.image, data.title, () => {
                for (let i = 0; i < buttons.length; i++) {
                    let currentButton = buttons[i];
                    if (i === buttonIndex) {
                        currentButton.SetSelected (true);
                    } else {
                        currentButton.SetSelected (false);
                    }
                }
                onClick (buttonIndex);
            });
            if (selectedIndex === buttonIndex) {
                button.SetSelected (true);
            }
            buttons.push (button);
        }
        return buttons;
    }

    AddSeparator ()
    {
        return $('<div>').addClass ('ov_toolbar_separator').appendTo (this.mainDiv);
    }
};
