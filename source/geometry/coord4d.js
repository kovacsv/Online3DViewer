OV.Coord4D = class
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
		return new OV.Coord4D (this.x, this.y, this.z, this.w);
	}
};
