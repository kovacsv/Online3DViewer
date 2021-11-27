OV.ToolbarButton = class
{
    constructor (image, imageTitle, onClick)
    {
        this.image = image;
        this.imageTitle = imageTitle;

        this.selected = false;
        this.buttonDiv = OV.CreateDiv ('ov_toolbar_button');
        this.buttonImg = OV.AddSvgIconElement (this.buttonDiv, this.image);
        if (onClick !== null) {
            this.buttonDiv.addEventListener ('click', onClick);
        }

        this.buttonDiv.setAttribute ('alt', this.imageTitle);
        OV.InstallTooltip (this.buttonDiv, this.imageTitle);
    }

    AddDomElements (parentDiv)
    {
        parentDiv.appendChild (this.buttonDiv);
    }

    AddClass (className)
    {
        this.buttonDiv.classList.add (className);
    }

    RemoveClass (className)
    {
        this.buttonDiv.classList.remove (className);
    }

    AddImageClass (className)
    {
        this.buttonImg.classList.add (className);
    }

    RemoveImageClass (className)
    {
        this.buttonImg.classList.remove (className);
    }

    SetSelected (selected)
    {
        this.selected = selected;
        if (this.selected) {
            this.buttonDiv.classList.add ('selected');
        } else {
            this.buttonDiv.classList.remove ('selected');
        }
    }
};

OV.Toolbar = class
{
    constructor (parentDiv)
    {
        this.mainDiv = OV.AddDiv (parentDiv, 'ov_toolbar');
    }

    AddImageButton (image, imageTitle, onClick)
    {
        let button = new OV.ToolbarButton (image, imageTitle, onClick);
        button.AddDomElements (this.mainDiv);
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
        return OV.AddDiv (this.mainDiv, 'ov_toolbar_separator');
    }
};
