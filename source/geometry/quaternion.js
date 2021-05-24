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
