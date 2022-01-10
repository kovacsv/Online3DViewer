import { BinaryWriter } from '../io/binarywriter.js';
import { FileFormat } from '../io/fileutils.js';
import { TextWriter } from '../io/textwriter.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

export class ExporterPly extends ExporterBase
{
	constructor ()
	{
		super ();
	}

    CanExport (format, extension)
    {
        return (format === FileFormat.Text || format === FileFormat.Binary) && extension === 'ply';
    }

	ExportContent (exporterModel, format, files, onFinish)
	{
		if (format === FileFormat.Text) {
			this.ExportText (exporterModel, files);
		} else {
			this.ExportBinary (exporterModel, files);
		}
		onFinish ();
	}

	ExportText (exporterModel, files)
	{
		let plyFile = new ExportedFile ('model.ply');
		files.push (plyFile);

		let plyWriter = new TextWriter ();

		let vertexCount = exporterModel.VertexCount ();
		let triangleCount = exporterModel.TriangleCount ();
		let headerText = this.GetHeaderText ('ascii', vertexCount, triangleCount);
		plyWriter.Write (headerText);

		exporterModel.EnumerateVerticesAndTriangles ({
			onVertex : function (x, y, z) {
				plyWriter.WriteArrayLine ([x, y, z]);
			},
			onTriangle : function (v0, v1, v2) {
				plyWriter.WriteArrayLine ([3, v0, v1, v2]);
			}
		});

		plyFile.SetTextContent (plyWriter.GetText ());
	}

	ExportBinary (exporterModel, files)
	{
		let plyFile = new ExportedFile ('model.ply');
		files.push (plyFile);

		let vertexCount = exporterModel.VertexCount ();
		let triangleCount = exporterModel.TriangleCount ();
		let headerText = this.GetHeaderText ('binary_little_endian', vertexCount, triangleCount);

		let fullByteLength = headerText.length + vertexCount * 3 * 4 + triangleCount * (1 + 3 * 4);
		let plyWriter = new BinaryWriter (fullByteLength, true);

		for (let i = 0; i < headerText.length; i++) {
			plyWriter.WriteUnsignedCharacter8 (headerText.charCodeAt (i));
		}

		exporterModel.EnumerateVerticesAndTriangles ({
			onVertex : function (x, y, z) {
				plyWriter.WriteFloat32 (x);
				plyWriter.WriteFloat32 (y);
				plyWriter.WriteFloat32 (z);
			},
			onTriangle : function (v0, v1, v2) {
				plyWriter.WriteUnsignedCharacter8 (3);
				plyWriter.WriteInteger32 (v0);
				plyWriter.WriteInteger32 (v1);
				plyWriter.WriteInteger32 (v2);
			}
		});

		plyFile.SetBufferContent (plyWriter.GetBuffer ());
	}

	GetHeaderText (format, vertexCount, triangleCount)
	{
		let headerWriter = new TextWriter ();
		headerWriter.WriteLine ('ply');
		headerWriter.WriteLine ('format ' + format + ' 1.0');
		headerWriter.WriteLine ('element vertex ' + vertexCount);
		headerWriter.WriteLine ('property float x');
		headerWriter.WriteLine ('property float y');
		headerWriter.WriteLine ('property float z');
		headerWriter.WriteLine ('element face ' + triangleCount);
		headerWriter.WriteLine ('property list uchar int vertex_index');
		headerWriter.WriteLine ('end_header');
		return headerWriter.GetText ();
	}
}
