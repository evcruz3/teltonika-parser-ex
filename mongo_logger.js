const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');
const mongo = require('mongodb')
console = consoleFormatter(console)

const PREFIX = "MONGGO_LOGGER"

process.stdout.write("\x1Bc")
log(Array(process.stdout.rows + 1).join('\n'));

var MongoClient = mongo.MongoClient
var mongoUrl = "mongodb://tft-server:tft100@167.71.159.65:27017/tft-server"

const db = MongoClient.connect(mongoUrl, function(err, db) {
    if (err) throw err
    return db.db("tft-server")
})

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

mqtt_client.on('connect', () => {
    log('Connected to MQTT broker')
    mqtt_client.subscribe([topic], () => {
        log(`Subscribed to topic '${topic}'`)
    })
})
mqtt_client.on('message', (topic, payload) => {
    
    let dev_id = topic.split("/")[2]
    let json_records = JSON.parse(payload)
    if(Array.isArray(json_records)){
        
            let myobjects = []
    
            json_records.forEach(record => {
                myobjects.push({deviceID: dev_id, record: record})
            })
            //let myobj = {deviceID: dev_id, records: json_records}
            dbo.collection("AVL DATA").insertMany(myobj, {ordered:true}, function(err, res){
                if (err) throw err
                log(`${myobjects.length} records inserted for deviceID ${dev_id}`)
                // db.close()
            })
    }
    else{
        log("Received data is not an AVL record")
    }

    

})

function log (message){
    console.log(`[${PREFIX}] `, message);
}

