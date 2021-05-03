OV.ExporterPly = class extends OV.ExporterBase
{
	constructor ()
	{
		super ();
	}

    CanExport (format, extension)
    {
        return (format === OV.FileFormat.Text || format === OV.FileFormat.Binary) && extension === 'ply';
    }
    
	ExportContent (model, format, files, onFinish)
	{
		if (format === OV.FileFormat.Text) {
			this.ExportText (model, files);
		} else {
			this.ExportBinary (model, files);
		}
		onFinish ();
	}

	ExportText (model, files)
	{
		let plyFile = new OV.ExportedFile ('model.ply');
		files.push (plyFile);

		let plyWriter = new OV.TextWriter ();

		let vertexCount = model.VertexCount ();
		let triangleCount = model.TriangleCount ();		
		let headerText = this.GetHeaderText ('ascii', vertexCount, triangleCount);
		plyWriter.Write (headerText);

		OV.EnumerateModelVerticesAndTriangles (model, {
			onVertex : function (x, y, z) {
				plyWriter.WriteArrayLine ([x, y, z]);
			},
			onTriangle : function (v0, v1, v2) {
				plyWriter.WriteArrayLine ([3, v0, v1, v2]);
			}
		});

		plyFile.SetContent (plyWriter.GetText ());
	}

	ExportBinary (model, files)
	{
		let plyFile = new OV.ExportedFile ('model.ply');
		files.push (plyFile);


		let vertexCount = model.VertexCount ();
		let triangleCount = model.TriangleCount ();
		let headerText = this.GetHeaderText ('binary_little_endian', vertexCount, triangleCount);

		let fullByteLength = headerText.length + vertexCount * 3 * 4 + triangleCount * (1 + 3 * 4);
		let plyWriter = new OV.BinaryWriter (fullByteLength, true);

		for (let i = 0; i < headerText.length; i++) {
			plyWriter.WriteUnsignedCharacter8 (headerText.charCodeAt (i));
		}

		OV.EnumerateModelVerticesAndTriangles (model, {
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

		plyFile.SetContent (plyWriter.GetBuffer ());
	}

	GetHeaderText (format, vertexCount, triangleCount)
	{
		let headerWriter = new OV.TextWriter ();
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
};
