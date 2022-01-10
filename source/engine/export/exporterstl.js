import { BinaryWriter } from '../io/binarywriter.js';
import { FileFormat } from '../io/fileutils.js';
import { TextWriter } from '../io/textwriter.js';
import { ExportedFile, ExporterBase } from './exporterbase.js';

export class ExporterStl extends ExporterBase
{
	constructor ()
	{
		super ();
	}

    CanExport (format, extension)
    {
        return (format === FileFormat.Text || format === FileFormat.Binary) && extension === 'stl';
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
		let stlFile = new ExportedFile ('model.stl');
		files.push (stlFile);

		let stlWriter = new TextWriter ();
		stlWriter.WriteLine ('solid Model');
		exporterModel.EnumerateTrianglesWithNormals ((v0, v1, v2, normal) => {
			stlWriter.WriteArrayLine (['facet', 'normal', normal.x, normal.y, normal.z]);
			stlWriter.Indent (1);
			stlWriter.WriteLine ('outer loop');
			stlWriter.Indent (1);
			stlWriter.WriteArrayLine (['vertex', v0.x, v0.y, v0.z]);
			stlWriter.WriteArrayLine (['vertex', v1.x, v1.y, v1.z]);
			stlWriter.WriteArrayLine (['vertex', v2.x, v2.y, v2.z]);
			stlWriter.Indent (-1);
			stlWriter.WriteLine ('endloop');
			stlWriter.Indent (-1);
			stlWriter.WriteLine ('endfacet');
		});
		stlWriter.WriteLine ('endsolid Model');

		stlFile.SetTextContent (stlWriter.GetText ());
	}

	ExportBinary (exporterModel, files)
	{
		let stlFile = new ExportedFile ('model.stl');
		files.push (stlFile);

		let triangleCount = exporterModel.TriangleCount ();
		let headerSize = 80;
		let fullByteLength = headerSize + 4 + triangleCount * 50;
		let stlWriter = new BinaryWriter (fullByteLength, true);

		for (let i = 0; i < headerSize; i++) {
			stlWriter.WriteUnsignedCharacter8 (0);
		}

		stlWriter.WriteUnsignedInteger32 (triangleCount);
		exporterModel.EnumerateTrianglesWithNormals ((v0, v1, v2, normal) => {
			stlWriter.WriteFloat32 (normal.x);
			stlWriter.WriteFloat32 (normal.y);
			stlWriter.WriteFloat32 (normal.z);

			stlWriter.WriteFloat32 (v0.x);
			stlWriter.WriteFloat32 (v0.y);
			stlWriter.WriteFloat32 (v0.z);

			stlWriter.WriteFloat32 (v1.x);
			stlWriter.WriteFloat32 (v1.y);
			stlWriter.WriteFloat32 (v1.z);

			stlWriter.WriteFloat32 (v2.x);
			stlWriter.WriteFloat32 (v2.y);
			stlWriter.WriteFloat32 (v2.z);

			stlWriter.WriteUnsignedInteger16 (0);
		});

		stlFile.SetBufferContent (stlWriter.GetBuffer ());
	}
}
