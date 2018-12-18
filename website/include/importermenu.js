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

	this.isOpen = null;
	this.openCloseImage = null;
	this.contentDiv = null;

	this.Initialize (name);
};

ImporterMenuItem.prototype.Initialize = function (name)
{
	var myThis = this;
	var menuItemDiv = $('<div>').addClass ('menuitem').appendTo (this.parentDiv);
	var menuItemClickHandler = null;
	
	var menuContent = null;		
	if (this.parameters !== undefined && this.parameters !== null) {
		if (this.parameters.id !== undefined && this.parameters.id !== null) {
			menuItemDiv.attr ('id', this.parameters.id);
		}
		if (this.parameters.openCloseButton !== undefined && this.parameters.openCloseButton !== null) {
			this.contentDiv = $('<div>').addClass ('menugroup').hide ().appendTo (this.parentDiv);
			this.isOpen = false;
			this.openCloseImage = $('<img>').addClass ('menubutton').attr ('title', this.parameters.openCloseButton.title).appendTo (menuItemDiv);
			this.openCloseImage.attr ('src', 'images/closed.png');
			menuItemClickHandler = this.OnOpenCloseClick.bind (this);
			this.openCloseImage.click (menuItemClickHandler);
		}

		if (this.parameters.userButton !== undefined && this.parameters.userButton !== null) {
			var userImage = $('<img>').addClass ('menubutton').attr ('title', this.parameters.userButton.title).appendTo (menuItemDiv);
			if (this.parameters.userButton.id !== undefined && this.parameters.userButton.id !== null) {
				userImage.attr ('id', this.parameters.userButton.id);
			}
			if (this.parameters.userButton.onCreate !== undefined && this.parameters.userButton.onCreate !== null) {
				this.parameters.userButton.onCreate (userImage, this.parameters.userButton.userData);
			}
			userImage.click (function () {
				if (myThis.parameters.userButton.onClick !== undefined && myThis.parameters.userButton.onClick !== null) {
					myThis.parameters.userButton.onClick (userImage, myThis.parameters.userButton.userData);
				}
			});
		}
	}

	var menuItemTextDiv = $('<div>').addClass ('menuitem').html (name).attr ('title', name).appendTo (menuItemDiv);
	if (menuItemClickHandler != null) {
		menuItemTextDiv.css ('cursor', 'pointer');
		menuItemTextDiv.click (menuItemClickHandler);
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

ImporterMenuItem.prototype.OnOpenCloseClick = function ()
{
	this.isOpen = !this.isOpen;
	if (this.isOpen) {
		if (this.parameters.openCloseButton.onOpen !== undefined && this.parameters.openCloseButton.onOpen !== null) {
			this.parameters.openCloseButton.onOpen (this.contentDiv, this.parameters.openCloseButton.userData);
		}
	} else {
		if (this.parameters.openCloseButton.onClose !== undefined && this.parameters.openCloseButton.onClose !== null) {
			this.parameters.openCloseButton.onClose (this.contentDiv, this.parameters.openCloseButton.userData);
		}
	}
	this.contentDiv.toggle ();
	this.openCloseImage.attr ('src', this.isOpen ? 'images/opened.png' : 'images/closed.png');
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
	this.buttonsDiv = $('<div>').addClass ('buttons').appendTo (parent);
};

ImporterButtons.prototype.AddLogo = function (title, onClick)
{
	var logoDiv = $('<div>').addClass ('logo').html (title).appendTo (this.buttonsDiv);
	logoDiv.click (onClick);
};

ImporterButtons.prototype.AddButton = function (image, title, onClick)
{
	var buttonImage = $('<img>').addClass ('topbutton').attr ('src', image).attr ('title', 'title').appendTo (this.buttonsDiv);
	buttonImage.click (function () {
		onClick ();
	});
};

ImporterButtons.prototype.AddToggleButton = function (image, toggleImage, title, onClick)
{
	var buttonImage = $('<img>').addClass ('topbutton').attr ('src', image).attr ('title', 'title').appendTo (this.buttonsDiv);
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
	this.buttonsDiv = $('<div>').addClass ('rightbuttons').appendTo (parent);
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
