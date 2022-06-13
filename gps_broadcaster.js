const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');
const moment = require('moment')

console = consoleFormatter(console)
Date.prototype.toJSON = function(){ return moment(this).format(); }

const PREFIX = "GPS_LOGGER"

// BROADCASTS GPS OF ALL DEVICES TO THE MQTT BROKER

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

    let recordlength = json_records.length
    let record = json_records[recordlength-1]
    all_gps["timestamp"] = record.timestamp
    all_gps[dev_id] = {"gps" : {"timestamp" : record.timestamp, "latitude" : record.gps.latitude, "longitude" : record.gps.longitude, "speed" : record.gps.speed}}

    mqtt_client.publish('/tft100-server/all-gps', JSON.stringify(all_gps), { qos: 0, retain: true }, (error) => {
        if (error) {
            console.error(error)
        }
        log("Broadcasted GPS")
    })


})

function log (message){
    console.log(`[${PREFIX}] `, message);
}

