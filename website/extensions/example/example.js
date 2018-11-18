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
	var buttonImage = document.createElement ('img');
	buttonImage.className = 'topbutton';
	buttonImage.src = 'extensions/example/example.png';
	buttonImage.title = 'Example button.';
	var myThis = this;
	buttonImage.onclick = function () {
		alert (JSON.stringify (myThis.ext.GetModelJson ()));
	};
	buttonsDiv.appendChild (buttonImage);
};
