import { CoordIsEqual3D } from '../geometry/coord3d.js';
import { IsEqual } from '../geometry/geometry.js';

export class Camera
{
    constructor (eye, center, up, fov)
    {
        this.eye = eye;
        this.center = center;
        this.up = up;
        this.fov = fov;
    }

    Clone ()
    {
        return new Camera (
            this.eye.Clone (),
            this.center.Clone (),
            this.up.Clone (),
            this.fov
        );
    }
}

export function CameraIsEqual3D (a, b)
{
	return CoordIsEqual3D (a.eye, b.eye) && CoordIsEqual3D (a.center, b.center) && CoordIsEqual3D (a.up, b.up) && IsEqual (a.fov, b.fov);
}
