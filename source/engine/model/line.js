export class Line
{
    constructor (v0, v1)
    {
        this.v0 = v0;
        this.v1 = v1;

        this.mat = null;
    }

    HasVertices ()
    {
        return this.v0 !== null && this.v1 !== null;
    }

    SetMaterial (mat)
    {
        this.mat = mat;
        return this;
    }

    Clone ()
    {
        let cloned = new Line (this.v0, this.v1);
        cloned.SetMaterial (this.mat);
        return cloned;
    }
}
