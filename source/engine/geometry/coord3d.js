import { IsEqual } from './geometry.js';

export class Coord3D
{
	constructor (x, y, z)
	{
		this.x = x;
		this.y = y;
		this.z = z;
	}

	Length ()
	{
		return Math.sqrt (this.x * this.x + this.y * this.y + this.z * this.z);
	}

	MultiplyScalar (scalar)
	{
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	Normalize ()
	{
		let length = this.Length ();
		if (length > 0.0) {
			this.MultiplyScalar (1.0 / length);
		}
		return this;
	}

	Offset (direction, distance)
	{
		let normal = direction.Clone ().Normalize ();
		this.x += normal.x * distance;
		this.y += normal.y * distance;
		this.z += normal.z * distance;
		return this;
	}

	Rotate (axis, angle, origo)
	{
		let normal = axis.Clone ().Normalize ();

		let u = normal.x;
		let v = normal.y;
		let w = normal.z;

		let x = this.x - origo.x;
		let y = this.y - origo.y;
		let z = this.z - origo.z;

		let si = Math.sin (angle);
		let co = Math.cos (angle);
		this.x = - u * (- u * x - v * y - w * z) * (1.0 - co) + x * co + (- w * y + v * z) * si;
		this.y = - v * (- u * x - v * y - w * z) * (1.0 - co) + y * co + (w * x - u * z) * si;
		this.z = - w * (- u * x - v * y - w * z) * (1.0 - co) + z * co + (- v * x + u * y) * si;

		this.x += origo.x;
		this.y += origo.y;
		this.z += origo.z;
		return this;
	}

	Clone ()
	{
		return new Coord3D (this.x, this.y, this.z);
	}
}

export function CoordIsEqual3D (a, b)
{
	return IsEqual (a.x, b.x) && IsEqual (a.y, b.y) && IsEqual (a.z, b.z);
}

export function AddCoord3D (a, b)
{
	return new Coord3D (a.x + b.x, a.y + b.y, a.z + b.z);
}

export function SubCoord3D (a, b)
{
	return new Coord3D (a.x - b.x, a.y - b.y, a.z - b.z);
}

export function CoordDistance3D (a, b)
{
	return Math.sqrt ((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));
}

export function DotVector3D (a, b)
{
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function VectorAngle3D (a, b)
{
	let aDirection = a.Clone ().Normalize ();
	let bDirection = b.Clone ().Normalize ();
	if (CoordIsEqual3D (aDirection, bDirection)) {
		return 0.0;
	}
	let product = DotVector3D (aDirection, bDirection);
	return Math.acos (product);
}

export function CrossVector3D (a, b)
{
	let result = new Coord3D (0.0, 0.0, 0.0);
	result.x = a.y * b.z - a.z * b.y;
	result.y = a.z * b.x - a.x * b.z;
	result.z = a.x * b.y - a.y * b.x;
	return result;
}

export function VectorLength3D (x, y, z)
{
	return Math.sqrt (x * x + y * y + z * z);
}

export function ArrayToCoord3D (arr)
{
	return new Coord3D (arr[0], arr[1], arr[2]);
}
