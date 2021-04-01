OV.TaskRunner = class
{
    constructor ()
    {
        this.count = null;
        this.current = null;
        this.callbacks = null;
    }

	Run (count, callbacks)
	{
        this.count = count;
		this.current = 0;
        this.callbacks = callbacks;
        if (count === 0) {
            this.TaskReady ();
        } else {
            this.RunOnce ();
        }
	}

    RunOnce ()
    {
        let obj = this;
        setTimeout (function () {
            obj.callbacks.runTask (obj.current, obj.TaskReady.bind (obj));
        }, 0);
    }

    TaskReady ()
    {
        this.current += 1;
        if (this.current < this.count) {
            this.RunOnce ();
        } else {
            if (this.callbacks.onReady) {
                this.callbacks.onReady ();
            }
        }
    }
};

OV.RunTaskAsync = function (task)
{
    setTimeout (function () {
        task ();
    }, 0);
};
