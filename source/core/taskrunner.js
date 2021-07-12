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

    RunBatch (count, batchCount, callbacks)
    {
        let stepCount = 0;
        if (count > 0) {
            stepCount = parseInt ((count - 1) / batchCount, 10) + 1;
        }
        this.Run (stepCount, {
            runTask : (index, ready) => {
                const firstIndex = index * batchCount;
                const lastIndex = Math.min ((index + 1) * batchCount, count) - 1;
                callbacks.runTask (firstIndex, lastIndex, ready);
            },
            onReady : callbacks.onReady
        });
    }

    RunOnce ()
    {
        setTimeout (() => {
            this.callbacks.runTask (this.current, this.TaskReady.bind (this));
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
    setTimeout (() => {
        task ();
    }, 0);
};
