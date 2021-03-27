OV.ExportedFile = class
{
	constructor (name)
	{
		this.name = name;
		this.url = null;
		this.content = null;
	}

	GetName ()
	{
		return this.name;
	}

	SetName (name)
	{
		this.name = name;
	}

	GetUrl ()
	{
		return this.url;
	}

	SetUrl (url)
	{
		this.url = url;
	}	

	GetContent ()
	{
		return this.content;
	}

	SetContent (content)
	{
		this.content = content;
	}
};

OV.ExporterBase = class
{
    constructor ()
    {
		this.callbacks = null;
    }

    CanExport (format, extension)
    {
        return false;
    }
    
	Export (model, format, files, callbacks)
	{
		this.callbacks = callbacks;
		this.ExportContent (model, format, files);
	}

	ExportContent (model, format, files)
	{

	}

	GetExportedMaterialName (originalName)
	{
		return this.GetExportedName (originalName, 'Material');
	}
	
	GetExportedMeshName (originalName)
	{
		return this.GetExportedName (originalName, 'Mesh');
	}	

	GetExportedName (originalName, defaultName)
	{
		if (originalName.length === 0) {
			return defaultName;
		}
		return originalName;
	}
};
