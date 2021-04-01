let cp = require ('child_process');
let pythonExecutable = 'python';
if (process.platform !== 'win32') {
    pythonExecutable = 'python3';
}
cp.spawnSync (pythonExecutable, process.argv.slice (2), {
    stdio: "inherit"
});
