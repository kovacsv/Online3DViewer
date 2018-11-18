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

ImporterMenu = function (parent)
{
	this.parent = parent;
	this.parent.empty ();
};

ImporterMenu.prototype.AddGroup = function (name, parameters)
{
	return this.AddSubItem (this.parent, name, parameters);
};

ImporterMenu.prototype.AddSubItem = function (parent, name, parameters)
{
	function GetTruncatedName (name)
	{
		var maxLength = 20;
		if (name.length > maxLength) {
			return name.substr (0, maxLength) + '...';
		}
		return name;
	}

	var menuItem = $('<div>').addClass ('menuitem').appendTo (parent);

	var menuContent = null;		
	if (parameters !== undefined && parameters !== null) {
		if (parameters.openCloseButton !== undefined && parameters.openCloseButton !== null) {
			menuContent = $('<div>').addClass ('menugroup').appendTo (parent);
			var isOpen = parameters.openCloseButton.isOpen;
			if (!isOpen) {
				menuContent.hide ();
			}
			
			var openCloseImage = $('<img>').addClass ('menubutton').attr ('title', parameters.openCloseButton.title).appendTo (menuItem);
			openCloseImage.attr ('src', isOpen ? parameters.openCloseButton.open : parameters.openCloseButton.close);
			openCloseImage.click (function () {
				isOpen = !isOpen;
				if (isOpen) {
					if (parameters.openCloseButton.onOpen !== undefined && parameters.openCloseButton.onOpen !== null) {
						parameters.openCloseButton.onOpen (menuContent, parameters.openCloseButton.userData);
					}
				} else {
					if (parameters.openCloseButton.onClose !== undefined && parameters.openCloseButton.onClose !== null) {
						parameters.openCloseButton.onClose (menuContent, parameters.openCloseButton.userData);
					}
				}
				menuContent.toggle ();
				openCloseImage.attr ('src', isOpen ? parameters.openCloseButton.open : parameters.openCloseButton.close);
			});
		}

		if (parameters.userButton !== undefined && parameters.userButton !== null) {
			var userImage = $('<img>').addClass ('menubutton').attr ('title', parameters.userButton.title).appendTo (menuItem);
			if (parameters.userButton.onCreate !== undefined && parameters.userButton.onCreate !== null) {
				parameters.userButton.onCreate (userImage, parameters.userButton.userData);
			}
			userImage.click (function () {
				if (parameters.userButton.onClick !== undefined && parameters.userButton.onClick !== null) {
					parameters.userButton.onClick (userImage, parameters.userButton.userData);
				}
			});
		}
	}

	$('<div>').addClass ('menuitem').html (GetTruncatedName (name)).attr ('title', name).appendTo (menuItem);
	return menuContent;
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
		width = this.maxWidth - 2;
	}
	this.contentDiv.width (width);
};
