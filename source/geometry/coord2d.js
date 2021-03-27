OV.Coord2D = class
{
	constructor (x, y)
	{
		this.x = x;
		this.y = y;
	}

	Clone ()
	{
		return new OV.Coord2D (this.x, this.y);
	}
};

OV.CoordIsEqual2D = function (a, b)
{
	return OV.IsEqual (a.x, b.x) && OV.IsEqual (a.y, b.y);
};

OV.AddCoord2D = function (a, b)
{
	return new OV.Coord2D (a.x + b.x, a.y + b.y);
};

OV.SubCoord2D = function (a, b)
{
	return new OV.Coord2D (a.x - b.x, a.y - b.y);
};

OV.CoordDistance2D = function (a, b)
{
	return Math.sqrt ((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
};
