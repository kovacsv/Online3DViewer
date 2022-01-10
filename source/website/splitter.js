export function CreateVerticalSplitter (splitterDiv, callbacks)
{
    let originalPosition = null;

    let mouseMoveHandler = (ev) => {
        ev.preventDefault ();
        const diff = ev.clientX - originalPosition;
        callbacks.onSplit (diff);
    };

    let mouseUpHandler = () => {
        document.removeEventListener ('mousemove', mouseMoveHandler);
        document.removeEventListener ('mouseup', mouseUpHandler);
        document.removeEventListener ('mouseleave', mouseUpHandler);
        originalPosition = null;
    };

    splitterDiv.addEventListener ('mousedown', (ev) => {
        originalPosition = ev.clientX;
        callbacks.onSplitStart ();

        document.addEventListener ('mousemove', mouseMoveHandler);
        document.addEventListener ('mouseup', mouseUpHandler);
        document.addEventListener ('mouseleave', mouseUpHandler);
    });
}
