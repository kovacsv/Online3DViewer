import { FileFormat } from '../io/fileutils.js';
import { TextWriter } from '../io/textwriter.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

export class ExporterOff extends ExporterBase
{
	constructor ()
	{
		super ();
	}

    CanExport (format, extension)
    {
        return format === FileFormat.Text && extension === 'off';
    }

	ExportContent (exporterModel, format, files, onFinish)
	{
		let offFile = new ExportedFile ('model.off');
		files.push (offFile);

		let offWriter = new TextWriter ();
		offWriter.WriteLine ('OFF');
		offWriter.WriteArrayLine ([exporterModel.VertexCount (), exporterModel.TriangleCount (), 0]);

		exporterModel.EnumerateVerticesAndTrianglesColor ({
			onVertexColor : function (x, y, z, color) {
				if (color)
				{
					offWriter.WriteArrayLine ([x, y, z, color.r, color.g, color.b]);
				}
				else
				{
					offWriter.WriteArrayLine ([x, y, z]);
				}
			},
			onTriangleColor : function (v0, v1, v2, color) {
				if (color)
				{
					// ignore alpha with max value
					if (color.a === 255)
						color.a = undefined;

					offWriter.WriteArrayLine ([3, v0, v1, v2, color.r, color.g, color.b, color.a]);
				}
				else
				{
					offWriter.WriteArrayLine ([3, v0, v1, v2]);
				}
			}
		});

		offFile.SetTextContent (offWriter.GetText ());
		onFinish ();
	}
}
