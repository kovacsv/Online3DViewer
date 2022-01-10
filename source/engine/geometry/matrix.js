import { Quaternion } from './quaternion.js';
import { Coord3D, VectorLength3D } from './coord3d.js';
import { IsEqual, IsNegative } from './geometry.js';
import { QuaternionFromAxisAngle } from './quaternion.js';

export class Matrix
{
    constructor (matrix)
    {
        this.matrix = null;
        if (matrix !== undefined && matrix !== null) {
            this.matrix = matrix;
        }
    }

    IsValid ()
    {
        return this.matrix !== null;
    }

    Set (matrix)
    {
        this.matrix = matrix;
        return this;
    }

    Get ()
    {
        return this.matrix;
    }

    Clone ()
    {
        let result = [
            this.matrix[0], this.matrix[1], this.matrix[2], this.matrix[3],
            this.matrix[4], this.matrix[5], this.matrix[6], this.matrix[7],
            this.matrix[8], this.matrix[9], this.matrix[10], this.matrix[11],
            this.matrix[12], this.matrix[13], this.matrix[14], this.matrix[15]
        ];
        return new Matrix (result);
    }

    CreateIdentity ()
    {
        this.matrix = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ];
        return this;
    }

    IsIdentity ()
    {
        let identity = new Matrix ().CreateIdentity ().Get ();
        for (let i = 0; i < 16; i++) {
            if (!IsEqual (this.matrix[i], identity[i])) {
                return false;
            }
        }
        return true;
    }

    CreateTranslation (x, y, z)
    {
        this.matrix = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            x, y, z, 1.0
        ];
        return this;
    }

    CreateRotation (x, y, z, w)
    {
        let x2 = x + x;
        let y2 = y + y;
        let z2 = z + z;
        let xx = x * x2;
        let xy = x * y2;
        let xz = x * z2;
        let yy = y * y2;
        let yz = y * z2;
        let zz = z * z2;
        let wx = w * x2;
        let wy = w * y2;
        let wz = w * z2;
        this.matrix = [
            1.0 - (yy + zz), xy + wz, xz - wy, 0.0,
            xy - wz, 1.0 - (xx + zz), yz + wx, 0.0,
            xz + wy, yz - wx, 1.0 - (xx + yy), 0.0,
            0.0, 0.0, 0.0, 1.0
        ];
        return this;
    }

    CreateRotationAxisAngle (axis, angle)
    {
        let quaternion = QuaternionFromAxisAngle (axis, angle);
        return this.CreateRotation (quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }

    CreateScale (x, y, z)
    {
        this.matrix = [
            x, 0.0, 0.0, 0.0,
            0.0, y, 0.0, 0.0,
            0.0, 0.0, z, 0.0,
            0.0, 0.0, 0.0, 1.0
        ];
        return this;
    }

    ComposeTRS (translation, rotation, scale)
    {
        let tx = translation.x;
        let ty = translation.y;
        let tz = translation.z;
        let qx = rotation.x;
        let qy = rotation.y;
        let qz = rotation.z;
        let qw = rotation.w;
        let sx = scale.x;
        let sy = scale.y;
        let sz = scale.z;

        let x2 = qx + qx;
        let y2 = qy + qy;
        let z2 = qz + qz;
        let xx = qx * x2;
        let xy = qx * y2;
        let xz = qx * z2;
        let yy = qy * y2;
        let yz = qy * z2;
        let zz = qz * z2;
        let wx = qw * x2;
        let wy = qw * y2;
        let wz = qw * z2;

        this.matrix = [
            (1.0 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0.0,
            (xy - wz) * sy, (1.0 - (xx + zz)) * sy, (yz + wx) * sy, 0.0,
            (xz + wy) * sz, (yz - wx) * sz, (1.0 - (xx + yy)) * sz, 0.0,
            tx, ty, tz, 1.0
        ];
        return this;
    }

    DecomposeTRS ()
    {
        let translation = new Coord3D (
            this.matrix[12],
            this.matrix[13],
            this.matrix[14]
        );

        let sx = VectorLength3D (this.matrix[0], this.matrix[1], this.matrix[2]);
        let sy = VectorLength3D (this.matrix[4], this.matrix[5], this.matrix[6]);
        let sz = VectorLength3D (this.matrix[8], this.matrix[9], this.matrix[10]);
        let determinant = this.Determinant ();
        if (IsNegative (determinant)) {
            sx *= -1.0;
        }
        let scale = new Coord3D (sx, sy, sz);

        let m00 = this.matrix[0] / sx;
        let m01 = this.matrix[4] / sy;
        let m02 = this.matrix[8] / sz;
        let m10 = this.matrix[1] / sx;
        let m11 = this.matrix[5] / sy;
        let m12 = this.matrix[9] / sz;
        let m20 = this.matrix[2] / sx;
        let m21 = this.matrix[6] / sy;
        let m22 = this.matrix[10] / sz;

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        let rotation = null;
        let tr = m00 + m11 + m22;
        if (tr > 0.0) {
            let s = Math.sqrt (tr + 1.0) * 2.0;
            rotation = new Quaternion (
                (m21 - m12) / s,
                (m02 - m20) / s,
                (m10 - m01) / s,
                0.25 * s
            );
        } else if ((m00 > m11) && (m00 > m22)) {
            let s = Math.sqrt (1.0 + m00 - m11 - m22) * 2.0;
            rotation = new Quaternion (
                0.25 * s,
                (m01 + m10) / s,
                (m02 + m20) / s,
                (m21 - m12) / s
            );
        } else if (m11 > m22) {
            let s = Math.sqrt (1.0 + m11 - m00 - m22) * 2.0;
            rotation = new Quaternion (
                (m01 + m10) / s,
                0.25 * s,
                (m12 + m21) / s,
                (m02 - m20) / s
            );
        } else {
            let s = Math.sqrt (1.0 + m22 - m00 - m11) * 2.0;
            rotation = new Quaternion (
                (m02 + m20) / s,
                (m12 + m21) / s,
                0.25 * s,
                (m10 - m01) / s
            );
        }

        return {
            translation : translation,
            rotation : rotation,
            scale : scale
        };
    }

    Determinant ()
    {
        let a00 = this.matrix[0];
        let a01 = this.matrix[1];
        let a02 = this.matrix[2];
        let a03 = this.matrix[3];
        let a10 = this.matrix[4];
        let a11 = this.matrix[5];
        let a12 = this.matrix[6];
        let a13 = this.matrix[7];
        let a20 = this.matrix[8];
        let a21 = this.matrix[9];
        let a22 = this.matrix[10];
        let a23 = this.matrix[11];
        let a30 = this.matrix[12];
        let a31 = this.matrix[13];
        let a32 = this.matrix[14];
        let a33 = this.matrix[15];

        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;

        let determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        return determinant;
    }

    Invert ()
    {
        let a00 = this.matrix[0];
        let a01 = this.matrix[1];
        let a02 = this.matrix[2];
        let a03 = this.matrix[3];
        let a10 = this.matrix[4];
        let a11 = this.matrix[5];
        let a12 = this.matrix[6];
        let a13 = this.matrix[7];
        let a20 = this.matrix[8];
        let a21 = this.matrix[9];
        let a22 = this.matrix[10];
        let a23 = this.matrix[11];
        let a30 = this.matrix[12];
        let a31 = this.matrix[13];
        let a32 = this.matrix[14];
        let a33 = this.matrix[15];

        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;

        let determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (IsEqual (determinant, 0.0)) {
            return null;
        }

        let result = [
            (a11 * b11 - a12 * b10 + a13 * b09) / determinant,
            (a02 * b10 - a01 * b11 - a03 * b09) / determinant,
            (a31 * b05 - a32 * b04 + a33 * b03) / determinant,
            (a22 * b04 - a21 * b05 - a23 * b03) / determinant,
            (a12 * b08 - a10 * b11 - a13 * b07) / determinant,
            (a00 * b11 - a02 * b08 + a03 * b07) / determinant,
            (a32 * b02 - a30 * b05 - a33 * b01) / determinant,
            (a20 * b05 - a22 * b02 + a23 * b01) / determinant,
            (a10 * b10 - a11 * b08 + a13 * b06) / determinant,
            (a01 * b08 - a00 * b10 - a03 * b06) / determinant,
            (a30 * b04 - a31 * b02 + a33 * b00) / determinant,
            (a21 * b02 - a20 * b04 - a23 * b00) / determinant,
            (a11 * b07 - a10 * b09 - a12 * b06) / determinant,
            (a00 * b09 - a01 * b07 + a02 * b06) / determinant,
            (a31 * b01 - a30 * b03 - a32 * b00) / determinant,
            (a20 * b03 - a21 * b01 + a22 * b00) / determinant
        ];

        return new Matrix (result);
    }

    MultiplyVector (vector)
    {
        let a00 = vector[0];
        let a01 = vector[1];
        let a02 = vector[2];
        let a03 = vector[3];

        let b00 = this.matrix[0];
        let b01 = this.matrix[1];
        let b02 = this.matrix[2];
        let b03 = this.matrix[3];
        let b10 = this.matrix[4];
        let b11 = this.matrix[5];
        let b12 = this.matrix[6];
        let b13 = this.matrix[7];
        let b20 = this.matrix[8];
        let b21 = this.matrix[9];
        let b22 = this.matrix[10];
        let b23 = this.matrix[11];
        let b30 = this.matrix[12];
        let b31 = this.matrix[13];
        let b32 = this.matrix[14];
        let b33 = this.matrix[15];

        let result = [
            a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
            a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
            a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
            a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33
        ];
        return result;
    }

    MultiplyMatrix (matrix)
    {
        let a00 = this.matrix[0];
        let a01 = this.matrix[1];
        let a02 = this.matrix[2];
        let a03 = this.matrix[3];
        let a10 = this.matrix[4];
        let a11 = this.matrix[5];
        let a12 = this.matrix[6];
        let a13 = this.matrix[7];
        let a20 = this.matrix[8];
        let a21 = this.matrix[9];
        let a22 = this.matrix[10];
        let a23 = this.matrix[11];
        let a30 = this.matrix[12];
        let a31 = this.matrix[13];
        let a32 = this.matrix[14];
        let a33 = this.matrix[15];

        let b00 = matrix.matrix[0];
        let b01 = matrix.matrix[1];
        let b02 = matrix.matrix[2];
        let b03 = matrix.matrix[3];
        let b10 = matrix.matrix[4];
        let b11 = matrix.matrix[5];
        let b12 = matrix.matrix[6];
        let b13 = matrix.matrix[7];
        let b20 = matrix.matrix[8];
        let b21 = matrix.matrix[9];
        let b22 = matrix.matrix[10];
        let b23 = matrix.matrix[11];
        let b30 = matrix.matrix[12];
        let b31 = matrix.matrix[13];
        let b32 = matrix.matrix[14];
        let b33 = matrix.matrix[15];

        let result = [
            a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
            a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
            a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
            a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
            a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
            a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
            a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
            a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
            a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
            a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
            a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
            a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
            a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
            a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
            a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
            a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33
        ];

        return new Matrix (result);
    }
}

export function MatrixIsEqual (a, b)
{
    const aMatrix = a.Get ();
    const bMatrix = b.Get ();
	for (let i = 0; i < 16; i++) {
        if (!IsEqual (aMatrix[i], bMatrix[i])) {
            return false;
        }
    }
    return true;
}
