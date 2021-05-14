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
