import * as childProcess from 'child_process';

let pythonExecutable = 'python';
if (process.platform !== 'win32') {
    pythonExecutable = 'python3';
}

let args = process.argv.slice (2);
let result = childProcess.spawnSync (pythonExecutable, args, {
    stdio: "inherit"
});

process.exit (result.status);
