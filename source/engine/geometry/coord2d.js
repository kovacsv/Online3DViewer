import { IsEqual } from './geometry.js';

export class Coord2D
{
	constructor (x, y)
	{
		this.x = x;
		this.y = y;
	}

	Clone ()
	{
		return new Coord2D (this.x, this.y);
	}
}

export function CoordIsEqual2D (a, b)
{
	return IsEqual (a.x, b.x) && IsEqual (a.y, b.y);
}

export function AddCoord2D (a, b)
{
	return new Coord2D (a.x + b.x, a.y + b.y);
}

export function SubCoord2D (a, b)
{
	return new Coord2D (a.x - b.x, a.y - b.y);
}

export function CoordDistance2D (a, b)
{
	return Math.sqrt ((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}
