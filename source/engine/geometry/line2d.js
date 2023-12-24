import { Coord2D, CoordDistance2D, DotVector2D, SubCoord2D } from './coord2d.js';
import { IsZero } from './geometry.js';

export class Segment2D
{
	constructor (beg, end)
	{
		this.beg = beg;
		this.end = end;
	}

	Clone ()
	{
		return new Segment2D (this.beg, this.end);
	}
}

export function ProjectPointToSegment2D (segment, point)
{
    let begToEndVec = SubCoord2D (segment.end, segment.beg);
    let begToPointVec = SubCoord2D (point, segment.beg);
    let nom = DotVector2D (begToEndVec, begToPointVec);
    let denom = DotVector2D (begToEndVec, begToEndVec);
    if (IsZero (denom)) {
        return segment.beg.Clone ();
    }
    let t = nom / denom;
    t = Math.max (0.0, Math.min (1.0, t));
    return new Coord2D (
        segment.beg.x + t * begToEndVec.x,
        segment.beg.y + t * begToEndVec.y
    );
}

export function SegmentPointDistance2D (segment, point)
{
    let projected = ProjectPointToSegment2D (segment, point);
    return CoordDistance2D (projected, point);
}
