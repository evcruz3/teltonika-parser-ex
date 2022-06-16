const { spawn } = require('child_process');
const fs = require('fs')

var processes = {}

loadMainService()
loadOtherServices()

async function loadMainService(){
    let tft_server = spawn('node', ['tft-server.js'])
    // processes[tft_server.pid] = ''

    tft_server.on('exit', function (code, signal) {
        console.log(`tft-server with pid ${children[child.pid]} exited with ` +
                    `code ${code} and signal ${signal}`);
    });

    tft_server.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    tft_server.stderr.on('data', (data) => {
        //console.error(`tft_server stderr:\n${data}`);
        let stream = fs.createWriteStream("error-log.txt", {flags:'a'});
        stream.write(`tft-server.js: ${data}\n`)
        Object.keys(processes).forEach(key => {
            key.kill('SIGINT')

            delete processes[key]
        });

        loadMainService()
        loadOtherServices()
    });
}

async function loadOtherServices(){
    let serviceNames = ['device_publisher.js', 'mongo_logger.js', 'device_publisher.js']
    
    serviceNames.forEach(serviceName => {
        spawnService(serviceName)
    })
}

async function spawnService(serviceName){
    let process = spawn('node', [serviceName])
    processes[process] = process.spawnargs[0]

    process.on('exit', function (code, signal) {
        console.log(`service ${process.spawnargs[0]} exited with ` +
                    `code ${code} and signal ${signal}`);

        delete processes[process]
    });

    process.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    
    process.stderr.on('data', (data) => {
        //console.error(`tft_server stderr:\n${data}`);
        let serviceName = process.spawnargs[0]
        let stream = fs.createWriteStream("error-log.txt", {flags:'a'});
        stream.write(`${serviceName}: ${data}\n`)

        delete processes[process]

        spawnService(serviceName)
    });
}
