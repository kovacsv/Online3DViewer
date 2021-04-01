OV.ImporterBase = class
{
    constructor ()
    {
        this.extension = null;
        this.callbacks = null;
        this.model = null;
        this.error = null;
        this.message = null;
    }
	
	Import (content, extension, callbacks)
	{
        this.extension = extension;
        this.callbacks = callbacks;
        this.model = new OV.Model ();
        this.error = false;
        this.message = null;

		this.ResetState ();
        this.ImportContent (content);
        if (this.error) {
            return;
        }

        if (OV.IsModelEmpty (this.model)) {
            this.error = true;
            return;
        }

        OV.FinalizeModel (this.model, this.callbacks.getDefaultMaterial);
	}

    ResetState ()
    {

    }

	CanImportExtension (extension)
	{
		return false;
	}

	GetKnownFileFormats ()
	{
		return {};
	}

    GetUpDirection ()
    {
        return OV.Direction.Z;
    }

    ImportContent (content)
    {

    }

    GetModel ()
    {
        return this.model;
    }

    SetError ()
    {
        this.error = true;
    }

    IsError ()
    {
        return this.error;
    }

    SetMessage (message)
    {
        this.message = message;
    }

    GetMessage ()
    {
        return this.message;
    }
};
