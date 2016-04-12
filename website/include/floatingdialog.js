FloatingDialog = function ()
{
	this.dialogDiv = null;
	this.mouseClick = this.MouseClick.bind (this);
};

FloatingDialog.prototype.Open = function (parameters)
{
	function AddButton (dialog, parent, button)
	{
		var buttonDiv = document.createElement ('div');
		buttonDiv.className = 'dialogbutton';
		buttonDiv.innerHTML = button.text;
		buttonDiv.onclick = function () {
			button.callback (dialog);
		};
		parent.appendChild (buttonDiv);	
	}

	if (this.dialogDiv !== null) {
		this.dialogDiv.Close ();
	}

	this.dialogDiv = document.createElement ('div');
	this.dialogDiv.className = 'dialog';
	
	var titleDiv = document.createElement ('div');
	titleDiv.className = 'dialogtitle';
	titleDiv.innerHTML = parameters.title;
	this.dialogDiv.appendChild (titleDiv);
	
	var contentDiv = document.createElement ('div');
	contentDiv.className = 'dialogcontent';
	contentDiv.innerHTML = parameters.text;
	this.dialogDiv.appendChild (contentDiv);

	var buttonsDiv = document.createElement ('div');
	buttonsDiv.className = 'dialogbuttons';
	this.dialogDiv.appendChild (buttonsDiv);

	var i, button;
	for (i = 0; i < parameters.buttons.length; i++) {
		button = parameters.buttons[i];
		AddButton (this, buttonsDiv, button);
	}
	document.body.appendChild (this.dialogDiv);

	document.addEventListener ('click', this.mouseClick, true);
	this.Resize ();
};

FloatingDialog.prototype.Close = function ()
{
	if (this.dialogDiv === null) {
		return;
	}
	
	document.body.removeChild (this.dialogDiv);
	document.removeEventListener ('click', this.mouseClick, true);
	this.dialogDiv = null;
};

FloatingDialog.prototype.Resize = function ()
{
	if (this.dialogDiv === null) {
		return;
	}
	
	this.dialogDiv.style.left = ((document.body.clientWidth - this.dialogDiv.clientWidth) / 2.0) + 'px';
	this.dialogDiv.style.top = ((document.body.clientHeight - this.dialogDiv.clientHeight) / 3.0) + 'px';
};

FloatingDialog.prototype.MouseClick = function (clickEvent)
{
	if (this.dialogDiv === null) {
		return;
	}

	var dialogClicked = false;
	var target = clickEvent.target;
	while (target !== null) {
		if (target === this.dialogDiv) {
			dialogClicked = true;
		}
		target = target.parentElement;
	}
	
	if (!dialogClicked) {
		this.Close ();
	}
};
