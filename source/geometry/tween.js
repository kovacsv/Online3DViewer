OV.BezierTweenFunction = function (distance, index, count)
{
    let t = index / count;
	return distance * (t * t * (3.0 - 2.0 * t));
};

OV.LinearTweenFunction = function (distance, index, count)
{
    return index * distance / count;
};

OV.ParabolicTweenFunction = function (distance, index, count)
{
    let t = index / count;
    let t2 = t * t;
    return distance * (t2 / (2.0 * (t2 - t) + 1.0));
};

OV.TweenCoord3D = function (a, b, count, tweenFunc)
{
	let dir = OV.SubCoord3D (b, a).Normalize ();
	let distance = OV.CoordDistance3D (a, b);
	let result = [];
	for (let i = 0; i < count; i++) {
        let step = tweenFunc (distance, i, count - 1);
		result.push (a.Clone ().Offset (dir, step));
	}
	return result;
};
