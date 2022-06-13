const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');

console = consoleFormatter(console)

const PREFIX = "MONGGO_LOGGER"

process.stdout.write("\x1Bc")
log(Array(process.stdout.rows + 1).join('\n'));


const host = '167.71.159.65'
const port = '1883'
const clientId = uuid.v1;

const connectUrl = `mqtt://${host}:${port}`
const mqtt_client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'tft100',
    password: 'S8Y5mvDdGGWjxj5h',
    reconnectPeriod: 1000,
})

const allowed_commands = ['sendCommand', 'setDeviceName', 'getGpsAll']
const topic = '/tft100-server/+/avlrecords'
mqtt_client.on('connect', () => {
    log('Connected to MQTT broker')
    mqtt_client.subscribe([topic], () => {
        log(`Subscribe to topic '${topic}'`)
    })
})
mqtt_client.on('message', (topic, payload) => {
    
    log(topic.split("/"))

    // let user_input = d.toString().trim()
    // log('Received Message from ' + topic.toString() + ": " + user_input)

    // let ui_command = user_input.split(" ")[0];
    
    // if (allowed_commands.includes(ui_command)){
    //     client.write(d)
    // }
})

function log (message){
    console.log(`[${PREFIX}] `, message);
}

