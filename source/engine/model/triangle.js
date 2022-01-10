export class Triangle
{
    constructor (v0, v1, v2)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;

        this.c0 = null;
        this.c1 = null;
        this.c2 = null;

        this.n0 = null;
        this.n1 = null;
        this.n2 = null;

        this.u0 = null;
        this.u1 = null;
        this.u2 = null;

        this.mat = null;
        this.curve = null;
    }

    HasVertices ()
    {
        return this.v0 !== null && this.v1 !== null && this.v2 !== null;
    }

    HasVertexColors ()
    {
        return this.c0 !== null && this.c1 !== null && this.c2 !== null;
    }

    HasNormals ()
    {
        return this.n0 !== null && this.n1 !== null && this.n2 !== null;
    }

    HasTextureUVs ()
    {
        return this.u0 !== null && this.u1 !== null && this.u2 !== null;
    }

    SetVertices (v0, v1, v2)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        return this;
    }

    SetVertexColors (c0, c1, c2)
    {
        this.c0 = c0;
        this.c1 = c1;
        this.c2 = c2;
        return this;
    }

    SetNormals (n0, n1, n2)
    {
        this.n0 = n0;
        this.n1 = n1;
        this.n2 = n2;
        return this;
    }

    SetTextureUVs (u0, u1, u2)
    {
        this.u0 = u0;
        this.u1 = u1;
        this.u2 = u2;
        return this;
    }

    SetMaterial (mat)
    {
        this.mat = mat;
        return this;
    }

    SetCurve (curve)
    {
        this.curve = curve;
        return this;
    }

    Clone ()
    {
        let cloned = new Triangle (this.v0, this.v1, this.v2);
        cloned.SetVertexColors (this.c0, this.c1, this.c2);
        cloned.SetNormals (this.n0, this.n1, this.n2);
        cloned.SetTextureUVs (this.u0, this.u1, this.u2);
        cloned.SetMaterial (this.mat);
        cloned.SetCurve (this.curve);
        return cloned;
    }
}
