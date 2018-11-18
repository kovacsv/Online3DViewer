ExampleExtension = function ()
{
	this.ext = null;
};

ExampleExtension.prototype.IsEnabled = function ()
{

	return true;
};

ExampleExtension.prototype.Init = function (extensionInterface)
{
	this.ext = extensionInterface;
	var buttonsDiv = this.ext.GetButtonsDiv ()
	var buttonImage = $('<img>').addClass ('topbutton').attr ('src', 'extensions/example/example.png').attr ('title', 'Example button.').appendTo (buttonsDiv);
	var myThis = this;
	buttonImage.click (function () {
		alert (JSON.stringify (myThis.ext.GetModelJson ()));
	});
};
