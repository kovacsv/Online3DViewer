OV.ImporterBuffers = class
{
    constructor (getBufferCallback)
    {
        this.getBufferCallback = getBufferCallback;
        this.fileBuffers = {};
        this.textureBuffers = {};
    }

    GetFileBuffer (filePath)
    {
        let fileName = OV.GetFileName (filePath);
        let buffer = this.fileBuffers[fileName];
        if (buffer === undefined) {
            buffer = this.getBufferCallback (fileName);
            this.fileBuffers[fileName] = buffer;
        }
        return buffer;
    }

    GetTextureBuffer (filePath)
    {
        let fileName = OV.GetFileName (filePath);
        let buffer = this.textureBuffers[fileName];
        if (buffer === undefined) {
            let texBuffer = this.getBufferCallback (fileName);
            if (texBuffer !== null) {
                buffer = {
                    url : OV.CreateObjectUrl (texBuffer),
                    buffer : texBuffer
                };
            } else {
                buffer = null;
            }
            this.textureBuffers[fileName] = buffer;
        }
        return buffer;
    }    
};

OV.ImporterBase = class
{
    constructor ()
    {
        this.extension = null;
        this.callbacks = null;
        this.buffers = null;
        this.model = null;
        this.error = null;
        this.message = null;
        this.buffers = null;
    }
	
	Import (content, extension, callbacks)
	{
        this.extension = extension;
        this.callbacks = callbacks;
        this.buffers = new OV.ImporterBuffers (this.callbacks.getFileBuffer);
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

    GetFileBuffer (filePath)
    {
        return this.buffers.GetFileBuffer (filePath);
    }

    GetTextureBuffer (filePath)
    {
        return this.buffers.GetTextureBuffer (filePath);
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
