const { spawn } = require('child_process');

children = {}
for(var i = 0; i<3; i++){
    let child = spawn('node', ['childprocess.js']);

    child.on('exit', function (code, signal) {
        console.log(`child process ${children[child]} exited with ` +
                    `code ${code} and signal ${signal}`);
        del children[child]
    });

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
    });

    children[child] = i
}
