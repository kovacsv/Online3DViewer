import { Coord3D } from './coord3d.js';

export class Box3D
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
        return new Coord3D (
            (this.min.x + this.max.x) / 2.0,
            (this.min.y + this.max.y) / 2.0,
            (this.min.z + this.max.z) / 2.0
        );
    }
}

export class BoundingBoxCalculator3D
{
    constructor ()
    {
        this.box = new Box3D (
            new Coord3D (Infinity, Infinity, Infinity),
            new Coord3D (-Infinity, -Infinity, -Infinity)
        );
        this.isValid = false;
    }

    GetBox ()
    {
        if (!this.isValid) {
            return null;
        }
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
        this.isValid = true;
    }
}
