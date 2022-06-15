const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');
const fs = require('fs')
const Pbf = require('pbf');
const compile = require('pbf/compile');
const schema = require('protocol-buffers-schema');
const proto = schema.parse(fs.readFileSync('tftserver.proto'));
const SystemMessage = compile(proto).SystemMessage;
const DeviceGps = compile(proto).DeviceGps


console = consoleFormatter(console)

const PREFIX = "APP-SERVER"
const lockParam = require('./lockparameter.json');
const { isBuffer } = require('util');
const digOut = lockParam.digOut

process.stdout.write("\x1Bc")
log(Array(process.stdout.rows + 1).join('\n'));

/*-----------------------
 --------- MQTT ---------
 ------------------------*/
const clientId = uuid.v1
const host = '167.71.159.65'
const port = '1883'
const connectUrl = `mqtt://${host}:${port}`

const mqtt_client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'tft100',
    password: 'S8Y5mvDdGGWjxj5h',
    reconnectPeriod: 1000,
})

const allowed_commands = ['unlockDevice','lockDevice', 'fetchAllGps']
const topics = ['/tft100-server/+/request', '/tft100-server/+/_gps']
var all_gps = {}

mqtt_client.on('connect', () => {
    topics.forEach(topic => {
        mqtt_client.subscribe([topic], () => {
            log(`Subscribed to topic '${topic}'`)
        })
    })
})
mqtt_client.on('message', (topic, payload) => {
    
    tmp = topic.split("/")
    topic_ending = tmp[tmp.length - 1]
    id = tmp[tmp.length - 2]

    let d = payload.toString()

    if(topic_ending == 'request'){
        let user_input = d.toString().trim()
        log('Received Message from ' + topic.toString() + ": " + user_input)

        let ui_command = user_input.split(" ")[0];
        console.log("uinput", user_input)
        console.log("ui_command", ui_command)
        
        if (allowed_commands.includes(ui_command)){
            processAppCommand(id, ui_command)
        }
        else{
            let response = "Invalid command"
            mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
                if (error) {
                console.error(error)
                }
            })
        }
    }
    else if(topic_ending == '_gps'){
        let pbf = new Pbf(payload);
        let data = DeviceGps.read(pbf)
        let id = data.deviceId

        all_gps[id] = {timestamp: data.timestamp, lat: data.lat, lng:data.lng, speed:data.speed}

        // Check for pending message for the TFT device
        let request = pending_requests[id]
        if(request !== undefined){
            //log("Pending request for " + id + ": ")
            //log(request)
            let now = new Date()
            let diff = (now.getTime() - request.timestamp.getTime())/1000

            log(`Pending request life: ${diff}`)
            if (diff <= 30){
                let pbf = new Pbf();
                let obj = SystemMessage.read(pbf);

                SystemMessage.write(obj, pbf);
                pbf.writeStringField(1, `${id}`)
                pbf.writeStringField(4, `${request.command}`)
                pbf.writeStringField(5, `${request.parameters}`)
                var buffer = pbf.finish();

                client.write(buffer)

                let response = "Pending Message Sent"
                mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
                    if (error) {
                    console.error(error)
                    }
                })
                
                log("Pending message sent to dev " + id)
            }
            delete pending_requests[id]
        }
    }
    
})

function processAppCommand(deviceId, command){
    let id = deviceId
    switch (command) {
        case "unlockDevice":{
            let pbf = new Pbf();
            let obj = SystemMessage.read(pbf);
            //let command = others[0]
            let command = "setdigout"

            // Might need a discussion on which is more energy-efficient to set to 1, locking or unlocking?
            let param = digOut == 1 ? "1 ?" : digOut == 2 ? "? 1" : "1 1";

            SystemMessage.write(obj, pbf);
            pbf.writeStringField(1, `${id}`)
            pbf.writeStringField(4, `${command}`)
            pbf.writeStringField(5, `${param}`)
            var buffer = pbf.finish();

            client.write(buffer)

            // let response = "OK"
            // mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
            //     if (error) {
            //     console.error(error)
            //     }
            // })
            break;
        }
        case "lockDevice":{
            let pbf = new Pbf();
            let obj = SystemMessage.read(pbf);
            //let command = others[0]
            let command = "setdigout"

            // Might need a discussion on which is more energy-efficient to set to 1, locking or unlocking?
            let param = digOut == 1 ? "1 ?" : digOut == 2 ? "? 1" : "1 1";

            SystemMessage.write(obj, pbf);
            pbf.writeStringField(1, `${id}`)
            pbf.writeStringField(4, `${command}`)
            pbf.writeStringField(5, `${param}`)
            var buffer = pbf.finish();

            client.write(buffer)

            // let response = "OK"
            // mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
            //     if (error) {
            //     console.error(error)
            //     }
            // })
            break;
        }
        case "fetchAllGps":{
            let response = JSON.stringify(all_gps)
            mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
                if (error) {
                console.error(error)
                }
            })
            break;
        }
        default:
            console.log(command, " not a valid command")
            break;
    }
}

/*-----------------------
 ------- TFT HOST -------
 ------------------------*/
const client = new net.Socket();

var intervalConnect = false;
function connect() {
    client.connect({
        port: 49365,
        host: 'localhost'
    })
}

function launchIntervalConnect() {
    if(false != intervalConnect) return
    intervalConnect = setInterval(connect, 5000)
}

function clearIntervalConnect() {
    if(false == intervalConnect) return
    clearInterval(intervalConnect)
    intervalConnect = false
}

var pending_requests = {}
client.on('data', (payload) => {     
    //log(`Received from LOGGER: ${data}`); 

    let pbf = new Pbf(payload);
    let data = SystemMessage.read(pbf)

    console.log(data)

    let id = data.deviceId
    let messageCode = data.code
    let now = new Date()

    

    if(messageCode == 3){
        pending_requests[id] = {command: data.command, parameters : data.parameters, timestamp : now}
    }

    let response = messageCode == 0 ? "OK. Command sent to device" : 
        messageCode == 3 ? "Device Offline. Will retry for 30 seconds" :
        `Server Response Code: ${messageCode}`

    mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }
    })

    
    
});  
// Add a 'close' event handler for the client socket 
client.on('close', () => { 
    log('logger closed'); 
    connect()
});  
client.on('error', (err) => { 
    console.error(err); 
    launchIntervalConnect()
}); 

client.on('connect', () => {
    clearIntervalConnect()
    log("Created a connection to ui node")

})

client.setTimeout(30000)
client.on('timeout', () => {
    log("TIMED OUT")
})

connect()

function log (message){
    console.log(`[${PREFIX}] `, message);
}










