OV.Eps = 0.00000001;
OV.RadDeg = 57.29577951308232;
OV.DegRad = 0.017453292519943;

OV.IsZero = function (a)
{
	return Math.abs (a) < OV.Eps;
};

OV.IsLower = function (a, b)
{
	return b - a > OV.Eps;
};

OV.IsGreater = function (a, b)
{
	return a - b > OV.Eps;
};

OV.IsLowerOrEqual = function (a, b)
{
	return b - a > -OV.Eps;
};

OV.IsGreaterOrEqual = function (a, b)
{
	return a - b > -OV.Eps;
};

OV.IsEqual = function (a, b)
{
	return Math.abs (b - a) < OV.Eps;
};

OV.IsEqualEps = function (a, b, eps)
{
	return Math.abs (b - a) < eps;
};

OV.IsPositive = function (a)
{
	return a > OV.Eps;
};

OV.IsNegative = function (a)
{
	return a < -OV.Eps;
};

OV.Direction =
{
	X : 1,
	Y : 2,
	Z : 3
};
