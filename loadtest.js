const { spawn } = require('child_process');

var children = {}
for(var i = 0; i<5; i++){
    var child;
    child = spawn('node', ['childprocess.js']);
    
    children[child.pid] = i

    setChildEvents(child)
    

}

function setChildEvents(child){
    child.on('exit', function (code, signal) {
        console.log(`child process ${children[child.pid]} exited with ` +
                    `code ${code} and signal ${signal}`);

    });

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
    });
}

console.log(children)
