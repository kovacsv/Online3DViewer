export const Eps = 0.00000001;
export const BigEps = 0.0001;
export const RadDeg = 57.29577951308232;
export const DegRad = 0.017453292519943;

export function IsZero (a)
{
	return Math.abs (a) < Eps;
}

export function IsLower (a, b)
{
	return b - a > Eps;
}

export function IsGreater (a, b)
{
	return a - b > Eps;
}

export function IsLowerOrEqual (a, b)
{
	return b - a > -Eps;
}

export function IsGreaterOrEqual (a, b)
{
	return a - b > -Eps;
}

export function IsEqual (a, b)
{
	return Math.abs (b - a) < Eps;
}

export function IsEqualEps (a, b, eps)
{
	return Math.abs (b - a) < eps;
}

export function IsPositive (a)
{
	return a > Eps;
}

export function IsNegative (a)
{
	return a < -Eps;
}

export const Direction =
{
	X : 1,
	Y : 2,
	Z : 3
};
