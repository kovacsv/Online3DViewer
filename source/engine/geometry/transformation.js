import { Coord3D } from './coord3d.js';
import { Matrix, MatrixIsEqual } from './matrix.js';

export class Transformation
{
    constructor (matrix)
    {
        if (matrix !== undefined && matrix !== null) {
            this.matrix = matrix;
        } else {
            this.matrix = new Matrix ();
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

    Append (transformation)
    {
        this.AppendMatrix (transformation.GetMatrix ());
        return this;
    }

    TransformCoord3D (coord)
    {
        let resultVector = this.matrix.MultiplyVector ([coord.x, coord.y, coord.z, 1.0]);
        let result = new Coord3D (resultVector[0], resultVector[1], resultVector[2]);
        return result;
    }

    Clone ()
    {
        const clonedMatrix = this.matrix.Clone ();
        return new Transformation (clonedMatrix);
    }
}

export function TransformationIsEqual (a, b)
{
    return MatrixIsEqual (a.GetMatrix (), b.GetMatrix ());
}
