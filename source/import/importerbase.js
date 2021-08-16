OV.ImporterBase = class
{
    constructor ()
    {
        
    }
    
    Import (content, extension, callbacks)
    {
        this.Clear ();

        this.extension = extension;
        this.callbacks = callbacks;
        this.model = new OV.Model ();
        this.error = false;
        this.message = null;
        this.ResetContent ();
        this.ImportContent (content, () => {
            this.CreateResult (callbacks);
        });
    }

    Clear ()
    {
        this.extension = null;
        this.callbacks = null;
        this.model = null;
        this.error = null;
        this.message = null;
        this.ClearContent ();
    }

    CreateResult (callbacks)
    {
        if (this.error) {
            callbacks.onError ();
            callbacks.onComplete ();
            return;
        }

        if (OV.IsModelEmpty (this.model)) {
            this.error = true;
            callbacks.onError ();
            callbacks.onComplete ();
            return;
        }

        OV.FinalizeModel (this.model, this.callbacks.getDefaultMaterial);
        callbacks.onSuccess ();
        callbacks.onComplete ();
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

    ClearContent ()
    {

    }

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {

    }

    GetModel ()
    {
        return this.model;
    }

    SetError (message)
    {
        this.error = true;
        if (message !== undefined && message !== null) {
            this.message = message;
        }
    }

    WasError ()
    {
        return this.error;
    }

    GetErrorMessage ()
    {
        return this.message;
    }
};
