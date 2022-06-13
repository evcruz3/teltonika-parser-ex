const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');
var Pbf = require('pbf');
var compile = require('pbf/compile');
var schema = require('protocol-buffers-schema');
var fs = require('fs');
var proto = schema.parse(fs.readFileSync('tftserver.proto'));
var TFTDevice = compile(proto).DeviceDetails;

console = consoleFormatter(console)

const PREFIX = "DEV_BROADCASTER"

// BROADCASTS GPS OF ALL DEVICES TO THE MQTT BROKER

process.stdout.write("\x1Bc")
log(Array(process.stdout.rows + 1).join('\n'));


const host = '167.71.159.65'
const port = '1883'
const clientId = uuid.v1;

const lockParam = require('./lockparameter.json')
const digOut = lockParam.digOut

const connectUrl = `mqtt://${host}:${port}`
const mqtt_client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'tft100',
    password: 'S8Y5mvDdGGWjxj5h',
    reconnectPeriod: 1000,
})

const topic = '/tft100-server/+/avlrecords'

var all_gps = {}

mqtt_client.on('connect', () => {
    log('Connected to MQTT broker')
    mqtt_client.subscribe([topic], () => {
        log(`Subscribed to topic '${topic}'`)
    })
})
mqtt_client.on('message', (topic, payload) => {
    let dev_id = topic.split("/")[2]
    let json_records = JSON.parse(payload)

    let digOutAvlID = digOut == 1 ? 179 : digOut == 2 ? 180:null;
    
    log("digOutAvlID: " + digOutAvlID)
    


    // mqtt_client.publish('/tft100-server/all-gps', JSON.stringify(all_gps), { qos: 0, retain: true }, (error) => {
    //     if (error) {
    //         console.error(error)
    //     }
    //     log("Broadcasted GPS")
    // })


})

function log (message){
    console.log(`[${PREFIX}] `, message);
}

