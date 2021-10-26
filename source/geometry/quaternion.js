OV.Quaternion = class
{
	constructor (x, y, z, w)
	{
		this.x = x;
		this.y = y;
		this.z = z;
        this.w = w;
	}
};

OV.ArrayToQuaternion = function (arr)
{
	return new OV.Quaternion (arr[0], arr[1], arr[2], arr[3]);
};

OV.QuaternionFromAxisAngle = function (axis, angle)
{
	const a = angle / 2.0;
	const s = Math.sin (a);

	return new OV.Quaternion (
		axis.x * s,
		axis.y * s,
		axis.z * s,
		Math.cos (a)
	);
};
