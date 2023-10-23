export class Line
{
    constructor (vertices)
    {
        this.vertices = vertices;
        this.mat = null;
    }

    HasVertices ()
    {
        return this.vertices !== null && this.vertices.length >= 2;
    }

    GetVertices ()
    {
        return this.vertices;
    }

    SetMaterial (mat)
    {
        this.mat = mat;
        return this;
    }

    SegmentCount ()
    {
        if (this.vertices === null) {
            return 0;
        }
        return this.vertices.length - 1;
    }

    Clone ()
    {
        let cloned = new Line ([...this.vertices]);
        cloned.SetMaterial (this.mat);
        return cloned;
    }
}
