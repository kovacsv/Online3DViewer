OV.Box3D = class
{
    constructor (min, max)
    {
        this.min = min;
        this.max = max;
    }

    GetMin ()
    {
        return this.min;
    }

    GetMax ()
    {
        return this.max;
    }

    GetCenter ()
    {
        return new OV.Coord3D (
            (this.min.x + this.max.x) / 2.0,
            (this.min.y + this.max.y) / 2.0,
            (this.min.z + this.max.z) / 2.0
        );
    }
};

OV.BoundingBoxCalculator3D = class
{
    constructor ()
    {
        this.box = new OV.Box3D (
            new OV.Coord3D (Infinity, Infinity, Infinity),
            new OV.Coord3D (-Infinity, -Infinity, -Infinity)
        );
    }

    GetBox ()
    {
        return this.box;
    }

    AddPoint (point)
    {
        this.box.min.x = Math.min (this.box.min.x, point.x);
        this.box.min.y = Math.min (this.box.min.y, point.y);
        this.box.min.z = Math.min (this.box.min.z, point.z);
        this.box.max.x = Math.max (this.box.max.x, point.x);
        this.box.max.y = Math.max (this.box.max.y, point.y);
        this.box.max.z = Math.max (this.box.max.z, point.z);
    }
};
