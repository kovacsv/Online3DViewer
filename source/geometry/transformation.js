OV.Transformation = class
{
    constructor (matrix)
    {
        if (matrix !== undefined && matrix !== null) {
            this.matrix = matrix;
        } else {
            this.matrix = new OV.Matrix ();
            this.matrix.CreateIdentity ();
        }
    }

    SetMatrix (matrix)
    {
        this.matrix = matrix;
        return this;
    }

    GetMatrix ()
    {
        return this.matrix;
    }

    IsIdentity ()
    {
        return this.matrix.IsIdentity ();
    }

    AppendMatrix (matrix)
    {
        this.matrix = this.matrix.MultiplyMatrix (matrix);
        return this;
    }

    TransformCoord3D (coord)
    {
        let resultVector = this.matrix.MultiplyVector ([coord.x, coord.y, coord.z, 1.0]);
        let result = new OV.Coord3D (resultVector[0], resultVector[1], resultVector[2]);
        return result;
    }
};
