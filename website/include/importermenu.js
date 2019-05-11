function IsSet (val)
{
	return val !== undefined && val !== null;
}

InfoTable = function (parent)
{
	this.table = $('<table>').addClass ('infotable').appendTo (parent);
};

InfoTable.prototype.AddRow = function (name, value)
{
	var tableRow = $('<tr>').appendTo (this.table);
	$('<td>').html (name).appendTo (tableRow);
	$('<td>').html (value).appendTo (tableRow);
};

InfoTable.prototype.AddColorRow = function (name, color)
{
	var tableRow = $('<tr>').appendTo (this.table);
	$('<td>').html (name).appendTo (tableRow);

	var valueColumn = document.createElement ('td');
	var valueColumn = $('<td>').appendTo (tableRow);
	
	var colorDiv = $('<div>').addClass ('colorbutton').appendTo (valueColumn);
	colorDiv.attr ('title', '(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
	var hexColor = JSM.RGBComponentsToHexColor (color[0] * 255.0, color[1] * 255.0, color[2] * 255.0);
	var colorString = hexColor.toString (16);
	while (colorString.length < 6) {
		colorString = '0' + colorString;
	}
	colorDiv.css ('background', '#' + colorString);
};

ImporterMenuItem = function (parentDiv, name, parameters)
{
	this.parentDiv = parentDiv;
	this.parameters = parameters;

	this.menuItemDiv = null;
	this.isOpen = null;
	this.openCloseImage = null;
	this.contentDiv = null;

	this.Initialize (name);
};

ImporterMenuItem.prototype.Initialize = function (name)
{
	this.menuItemDiv = $('<div>').addClass ('menuitem').appendTo (this.parentDiv);
	if (IsSet (this.parameters)) {
		if (IsSet (this.parameters.id)) {
			this.menuItemDiv.attr ('id', this.parameters.id);
		}
		if (IsSet (this.parameters.openCloseButton)) {
			this.AddOpenCloseButton ();
		}
		if (IsSet (this.parameters.userButtons)) {
			var i, userButton;
			for (i = 0; i < this.parameters.userButtons.length; i++) {
				userButton = this.parameters.userButtons[i];
				this.AddUserButton (userButton);
			}
		}
	}

	var menuItemTextDiv = $('<div>').addClass ('menuitem').html (name).attr ('title', name).appendTo (this.menuItemDiv);
	if (IsSet (this.parameters) && IsSet (this.parameters.openCloseButton)) {
		menuItemTextDiv.css ('cursor', 'pointer');
	}
};

ImporterMenuItem.prototype.AddSubItem = function (name, parameters)
{
	return new ImporterMenuItem (this.contentDiv, name, parameters);
};

ImporterMenuItem.prototype.GetContentDiv = function ()
{
	return this.contentDiv;
};

ImporterMenuItem.prototype.AddOpenCloseButton = function ()
{
	var myThis = this;
	this.isOpen = false;
	this.contentDiv = $('<div>').addClass ('menuitemcontent').hide ().appendTo (this.parentDiv);
	this.openCloseImage = $('<img>').addClass ('menubutton').attr ('title', this.parameters.openCloseButton.title).appendTo (this.menuItemDiv);
	this.openCloseImage.attr ('src', 'images/closed.png');
	this.menuItemDiv.click (function () {
		myThis.SetOpen (!myThis.isOpen);
	});
};

ImporterMenuItem.prototype.AddUserButton = function (userButton)
{
	var userImage = $('<img>').addClass ('menubutton').attr ('title', userButton.title).appendTo (this.menuItemDiv);
	if (IsSet (userButton.id)) {
		userImage.attr ('id', userButton.id);
	}
	if (IsSet (userButton.onCreate)) {
		userButton.onCreate (userImage, userButton.userData);
	}
	if (IsSet (userButton.onClick) || IsSet (userButton.onCtrlClick)) {
		userImage.click (function (event) {
			event.stopPropagation ();
			if (event.ctrlKey && IsSet (userButton.onCtrlClick)) {
				userButton.onCtrlClick (userImage, userButton.userData);
			} else if (IsSet (userButton.onClick)) {
				userButton.onClick (userImage, userButton.userData);
			}
		});
	}
};

ImporterMenuItem.prototype.SetOpen = function (isOpen)
{
	this.isOpen = isOpen;
	if (this.isOpen) {
		if (IsSet (this.parameters.openCloseButton.onOpen)) {
			this.parameters.openCloseButton.onOpen (this.contentDiv, this.parameters.openCloseButton.userData);
		}
		this.contentDiv.show ();
		this.openCloseImage.attr ('src', 'images/opened.png');
	} else {
		if (IsSet (this.parameters.openCloseButton.onClose)) {
			this.parameters.openCloseButton.onClose (this.contentDiv, this.parameters.openCloseButton.userData);
		}
		this.contentDiv.hide ();
		this.openCloseImage.attr ('src', 'images/closed.png');
	}
};

ImporterMenuItem.prototype.Highlight = function (highlight)
{
	if (highlight) {
		this.menuItemDiv.addClass ('highlighted');
	} else {
		this.menuItemDiv.removeClass ('highlighted');
	}
};

ImporterMenuItem.prototype.IsHighlighted = function ()
{
	return this.menuItemDiv.hasClass ('highlighted');
};

ImporterMenu = function (parentDiv)
{
	this.parentDiv = parentDiv;
	this.parentDiv.empty ();
};

ImporterMenu.prototype.AddGroup = function (name, parameters)
{
	return new ImporterMenuItem (this.parentDiv, name, parameters);
};

ImporterButtons = function (parent)
{
	this.buttonsDiv = $('<div>').attr ('id', 'buttons').appendTo (parent);
};

ImporterButtons.prototype.AddLogo = function (title)
{
	var logoDiv = $('<div>').attr ('id', 'logo').html (title).appendTo (this.buttonsDiv);
	logoDiv.click (function () {
		location.hash = '';
		location.reload ();
	});
};

ImporterButtons.prototype.AddButton = function (image, title, onClick)
{
	var buttonImage = $('<img>').addClass ('topbutton').attr ('src', image).attr ('title', title).appendTo (this.buttonsDiv);
	buttonImage.click (function () {
		onClick ();
	});
};

ImporterButtons.prototype.AddToggleButton = function (image, toggleImage, title, onClick)
{
	var buttonImage = $('<img>').addClass ('topbutton').attr ('src', image).attr ('title', title).appendTo (this.buttonsDiv);
	var isOn = true;
	buttonImage.click (function () {
		isOn = !isOn;
		if (isOn) {
			buttonImage.attr ('src', image);
		} else {
			buttonImage.attr ('src', toggleImage);
		}
		onClick ();
	});
};

ExtensionButtons = function (parent)
{
	this.buttonsDiv = $('<div>').attr ('id', 'extbuttons').appendTo (parent);
};

ExtensionButtons.prototype.GetButtonsDiv = function ()
{
	return this.buttonsDiv;
};

ImporterProgressBar = function (parent)
{
	this.parent = parent;
	this.borderDiv = null;
	this.contentDiv = null;
	this.maxCount = null;
	this.maxWidth = null;
};

ImporterProgressBar.prototype.Init = function (maxCount)
{
	this.borderDiv = $('<div>').addClass ('progressbarborder').appendTo (this.parent);
	this.contentDiv = $('<div>').addClass ('progressbarcontent').appendTo (this.borderDiv);

	this.maxCount = maxCount;
	this.maxWidth = this.borderDiv.width ();
	this.Step (0);
};

ImporterProgressBar.prototype.Step = function (count)
{
	var step = this.maxWidth / this.maxCount;
	var width = count * step;
	if (count == this.maxCount) {
		width = this.maxWidth;
	}
	this.contentDiv.width (width);
};
