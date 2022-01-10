import { ArrayBufferToUtf8String, Utf8StringToArrayBuffer } from '../io/bufferutils.js';

export class ExportedFile
{
	constructor (name)
	{
		this.name = name;
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

	GetTextContent ()
	{
		let text = ArrayBufferToUtf8String (this.content);
		return text;
	}

	GetBufferContent ()
	{
		return this.content;
	}

	SetTextContent (content)
	{
		let buffer = Utf8StringToArrayBuffer (content);
		this.content = buffer;
	}

	SetBufferContent (content)
	{
		this.content = content;
	}
}

export class ExporterBase
{
    constructor ()
    {

    }

    CanExport (format, extension)
    {
        return false;
    }

	Export (exporterModel, format, onFinish)
	{
		let files = [];
		this.ExportContent (exporterModel, format, files, () => {
			onFinish (files);
		});
	}

	ExportContent (exporterModel, format, files, onFinish)
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
}
