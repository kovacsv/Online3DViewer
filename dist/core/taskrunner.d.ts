export function RunTaskAsync(task: any): void;
export function RunTasks(count: any, callbacks: any): void;
export function RunTasksBatch(count: any, batchCount: any, callbacks: any): void;
export function WaitWhile(expression: any): void;
export class TaskRunner {
    count: any;
    current: number;
    callbacks: any;
    Run(count: any, callbacks: any): void;
    RunBatch(count: any, batchCount: any, callbacks: any): void;
    RunOnce(): void;
    TaskReady(): void;
}
//# sourceMappingURL=taskrunner.d.ts.map