const { spawn } = require('child_process');

const child = spawn('node childprocess.js');

child.on('exit', function (code, signal) {
    console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
});


child.stdout.on('data', (data) => {
    console.log(`child stdout:\n${data}`);
});

child.stderr.on('data', (data) => {
    console.error(`child stderr:\n${data}`);
});