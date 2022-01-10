export class Quaternion
{
	constructor (x, y, z, w)
	{
		this.x = x;
		this.y = y;
		this.z = z;
        this.w = w;
	}
}

export function ArrayToQuaternion (arr)
{
	return new Quaternion (arr[0], arr[1], arr[2], arr[3]);
}

export function QuaternionFromAxisAngle (axis, angle)
{
	const a = angle / 2.0;
	const s = Math.sin (a);

	return new Quaternion (
		axis.x * s,
		axis.y * s,
		axis.z * s,
		Math.cos (a)
	);
}
