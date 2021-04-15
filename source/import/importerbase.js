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

        let obj = this;
        obj.ResetState ();
        obj.ImportContent (content, function () {
            obj.CreateResult (callbacks);
        });
    }

    CreateResult (callbacks)
    {
        if (this.error) {
            callbacks.onError ();
            return;
        }

        if (OV.IsModelEmpty (this.model)) {
            this.error = true;
            callbacks.onError ();
            return;
        }

        OV.FinalizeModel (this.model, this.callbacks.getDefaultMaterial);
        callbacks.onSuccess ();
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

    ImportContent (content, onFinish)
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
