const { spawn } = require('child_process');

const child = spawn('node childprocess.js');

child.on('exit', function (code, signal) {
    console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
});


