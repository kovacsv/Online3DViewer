OV.Exporter = class
{
	constructor ()
	{
		this.exporters = [
			new OV.ExporterObj (),
			new OV.ExporterStl (),
			new OV.ExporterPly (),
			new OV.ExporterOff (),
			new OV.ExporterGltf ()
		];
	}

	Export (model, format, extension)
	{
		let files = [];
		for (let i = 0; i < this.exporters.length; i++) {
			let exporter = this.exporters[i];
			if (exporter.CanExport (format, extension)) {
				exporter.Export (model, format, files);
				break;
			}
		}
		return files;
	}
};
