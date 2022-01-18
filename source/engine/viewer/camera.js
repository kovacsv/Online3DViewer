import { CoordIsEqual3D } from '../geometry/coord3d.js';

export class Camera
{
    constructor (eye, center, up)
    {
        this.eye = eye;
        this.center = center;
        this.up = up;
    }

    Clone ()
    {
        return new Camera (
            this.eye.Clone (),
            this.center.Clone (),
            this.up.Clone ()
        );
    }
}

export function CameraIsEqual3D (a, b)
{
	return CoordIsEqual3D (a.eye, b.eye) && CoordIsEqual3D (a.center, b.center) && CoordIsEqual3D (a.up, b.up);
}
