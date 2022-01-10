export class Coord4D
{
	constructor (x, y, z, w)
	{
		this.x = x;
		this.y = y;
		this.z = z;
        this.w = w;
	}

	Clone ()
	{
		return new Coord4D (this.x, this.y, this.z, this.w);
	}
}
