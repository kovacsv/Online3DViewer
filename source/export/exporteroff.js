OV.ExporterOff = class extends OV.ExporterBase
{
	constructor ()
	{
		super ();
	}

    CanExport (format, extension)
    {
        return format === OV.FileFormat.Text && extension === 'off';
    }

	ExportContent (exporterModel, format, files, onFinish)
	{
		let offFile = new OV.ExportedFile ('model.off');
		files.push (offFile);

		let offWriter = new OV.TextWriter ();
		offWriter.WriteLine ('OFF');
		offWriter.WriteArrayLine ([exporterModel.VertexCount (), exporterModel.TriangleCount (), 0]);

		exporterModel.EnumerateVerticesAndTriangles ({
			onVertex : function (x, y, z) {
				offWriter.WriteArrayLine ([x, y, z]);
			},
			onTriangle : function (v0, v1, v2) {
				offWriter.WriteArrayLine ([3, v0, v1, v2]);
			}
		});

		offFile.SetTextContent (offWriter.GetText ());
		onFinish ();
	}
};
