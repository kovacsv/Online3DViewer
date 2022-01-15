import { IsEqual } from './geometry.js';

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

export function QuaternionIsEqual (a, b)
{
	return IsEqual (a.x, b.x) && IsEqual (a.y, b.y) && IsEqual (a.z, b.z) && IsEqual (a.w, b.w);
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

export function QuaternionFromXYZ (x, y, z, mode) {

	const c1 = Math.cos (x / 2.0);
	const c2 = Math.cos (y / 2.0);
	const c3 = Math.cos (z / 2.0);

	const s1 = Math.sin (x / 2.0);
	const s2 = Math.sin (y / 2.0);
	const s3 = Math.sin (z / 2.0);

	let quaternion = new Quaternion (0.0, 0.0, 0.0, 1.0);
	if (mode === 'XYZ') {
		quaternion.x = s1 * c2 * c3 + c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 - s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 + s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (mode === 'YXZ') {
		quaternion.x = s1 * c2 * c3 + c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 - s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 - s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 + s1 * s2 * s3;
	} else if (mode === 'ZXY') {
		quaternion.x = s1 * c2 * c3 - c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 + s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 + s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (mode === 'ZYX') {
		quaternion.x = s1 * c2 * c3 - c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 + s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 - s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 + s1 * s2 * s3;
	} else if (mode === 'YZX') {
		quaternion.x = s1 * c2 * c3 + c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 + s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 - s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 - s1 * s2 * s3;
	} else if (mode === 'XZY') {
		quaternion.x = s1 * c2 * c3 - c1 * s2 * s3;
		quaternion.y = c1 * s2 * c3 - s1 * c2 * s3;
		quaternion.z = c1 * c2 * s3 + s1 * s2 * c3;
		quaternion.w = c1 * c2 * c3 + s1 * s2 * s3;
	} else {
		return null;
	}

	return quaternion;
}
