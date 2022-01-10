export class TaskRunner
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
}

export function RunTaskAsync (task)
{
    setTimeout (() => {
        task ();
    }, 0);
}

export function RunTasks (count, callbacks)
{
    let taskRunner = new TaskRunner ();
    taskRunner.Run (count, callbacks);
}

export function RunTasksBatch (count, batchCount, callbacks)
{
    let taskRunner = new TaskRunner ();
    taskRunner.RunBatch (count, batchCount, callbacks);
}

export function WaitWhile (expression)
{
    function Waiter (expression)
    {
        if (expression ()) {
            setTimeout (() => {
                Waiter (expression);
            }, 1);
        }
    }
    Waiter (expression);
}
