export class TextWriter
{
	constructor ()
	{
		this.text = '';
		this.indentation = 0;
	}

	GetText ()
	{
		return this.text;
	}

	Indent (diff)
	{
		this.indentation += diff;
	}

	WriteArrayLine (arr)
	{
		this.WriteLine (arr.join (' '));
	}

	WriteLine (str)
	{
		this.WriteIndentation ();
		this.Write (str + '\n');
	}

	WriteIndentation ()
	{
		for (let i = 0; i < this.indentation; i++) {
			this.Write ('  ');
		}
	}

	Write (str)
	{
		this.text += str;
	}
}
