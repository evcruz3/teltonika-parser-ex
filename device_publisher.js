const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')
const uuid = require('uuid');
var Pbf = require('pbf');
var compile = require('pbf/compile');
var schema = require('protocol-buffers-schema');
var fs = require('fs');
var proto = schema.parse(fs.readFileSync('tftserver.proto'));
var TFTDevice = compile(proto).DeviceGps;
var AvlRecords = compile(proto).AvlRecords;
var DeviceResponse = compile(proto).DeviceResponse;

console = consoleFormatter(console)

const PREFIX = "DEV_PUBLISHER"

// BROADCASTS GPS OF ALL DEVICES TO THE MQTT BROKER

process.stdout.write("\x1Bc")
log(Array(process.stdout.rows + 1).join('\n'));


const host = '167.71.159.65'
const port = '1883'
const clientId = uuid.v1;

const lockParam = require('./lockparameter.json')
const digOut = lockParam.digOut
const digOutAvlID = digOut == 1 ? 179 : digOut == 2 ? 180 : null;

const connectUrl = `mqtt://${host}:${port}`
const mqtt_client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'tft100',
    password: 'S8Y5mvDdGGWjxj5h',
    reconnectPeriod: 1000,
})

const topics = ['/tft100-server/+/_avlrecords', '/tft100-server/+/_response']

mqtt_client.on('connect', () => {
    log('Connected to MQTT broker')
    topics.forEach(topic => {
        mqtt_client.subscribe([topic], () => {
            log(`Subscribed to topic '${topic}'`)
        })
    }) 
})
mqtt_client.on('message', (topic, buffer) => {
    let tmp = topic.split("/")
    let dev_id = tmp[2]

    let topic_ending = tmp[tmp.length - 1]

    if(topic_ending == '_avlrecords'){
        let pbf = new Pbf(buffer);
        let json_obj = AvlRecords.read(pbf)
        let payload = json_obj.data

        let json_records = null
        try {
            json_records = JSON.parse(payload)

            if(Array.isArray(json_records)){

                // Check Lock Status if the AVL ID of DigOut(1/2) exists on the record
                if (digOutAvlID){
                    json_records.every(record => {
                        let ioElements = record.ioElements
                        res = ioElements.find(o => o.id === digOutAvlID)
                        if(res){
                            let locked = res.value;
                            mqtt_client.publish(`/tft100-server/${dev_id}/isLocked`, locked, { qos: 0, retain: true }, (error) => {
                                if (error) {
                                    console.error(error)
                                }
                                log(`Published Lock Status of devID ${dev_id}: ${locked}`)
                            })
                            return false; // break from loop
                        }
                        else return true
                    })
                }

                // Published GPS details

                let record = json_records[json_records.length - 1]
                let pbf = new Pbf();
                let obj = TFTDevice.read(pbf);
                TFTDevice.write(obj, pbf);
                pbf.writeStringField(1, `${dev_id}`)
                pbf.writeStringField(2, `${record.timestamp}`)
                pbf.writeStringField(3, `${record.gps.latitude}`)
                pbf.writeStringField(4, `${record.gps.longitude}`)
                pbf.writeStringField(5, `${record.gps.speed}`)

                var buffer = pbf.finish();

                // publish the mqtt message
                mqtt_client.publish(`/tft100-server/${dev_id}/_gps`, buffer, { qos: 0, retain: true }, (error) => {
                    if (error) {
                        console.error(error)
                    }
                    log(`Published GPS of devID ${dev_id}`)
                })


                
            }
            else{
                log("Received data is not an AVL record")
            }
        } catch (error) {
            log("Received data is not JSON-parseable")
        }
    }
    else{
        let pbf = new Pbf(buffer);
        let payload = DeviceResponse.read(pbf)
        let message = payload.response

        let regex = digOut == 1 ? /DOUT1:\d/ : digOut == 2 ? /DOUT2:\d/ : null;
        if(regex){
            //console.log(message)
            //console.log(`Search for '${regex}'`)
            
            let re = new RegExp(regex)
            let result = message.match(re)
            message.match(re)
            //console.log("result: ", result)
            
            if(result){
                let match = result[0]
                let isLocked = match.split(":")[1]
                let data = isLocked == "1" ? "0":"1";
                //console.log("isLocked: ", isLocked)
                mqtt_client.publish(`/tft100-server/${dev_id}/isLocked`, data, { qos: 0, retain: true }, (error) => {
                    if (error) {
                        console.error(error)
                    }
                    log(`Updated lock status of ${dev_id}:${isLocked}`)
                })
            }
        }
        else{
            log("NO DIGOUT PROPERLY SET FOR LOCKING/UNLOCKING DEVICE")
        }
        
        
        
    }

})

function log (message){
    console.log(`[${PREFIX}] `, message);
}

