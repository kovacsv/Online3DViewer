OV.VerticalSplitter = class
{
    constructor (splitterDiv, callbacks)
    {
        this.callbacks = callbacks;
        this.mouseMoveHandler = (ev) => {
            this.OnMouseMove (ev);
        };
        this.mouseUpHandler = () => {
            this.OnMouseUp ();
        };
        splitterDiv.mousedown ((ev) => {
            this.OnMouseDown (ev);
        });
        this.originalPosition = null;
    }

    OnMouseDown (ev)
    {
        this.originalPosition = ev.clientX;
        this.callbacks.onSplitStart ();

        document.addEventListener ('mousemove', this.mouseMoveHandler);
        document.addEventListener ('mouseup', this.mouseUpHandler);
        document.addEventListener ('mouseleave', this.mouseUpHandler);
    }

    OnMouseMove (ev)
    {
        ev.preventDefault ();
        const diff = ev.clientX - this.originalPosition;
        this.callbacks.onSplit (diff);
    }

    OnMouseUp ()
    {
        document.removeEventListener ('mousemove', this.mouseMoveHandler);
        document.removeEventListener ('mouseup', this.mouseUpHandler);
        document.removeEventListener ('mouseleave', this.mouseUpHandler);

        this.originalPosition = null;
    }
};
