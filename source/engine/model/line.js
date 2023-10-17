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

    SetMaterial (mat)
    {
        this.mat = mat;
        return this;
    }

    Clone ()
    {
        let cloned = new Line ([...this.vertices]);
        cloned.SetMaterial (this.mat);
        return cloned;
    }
}
