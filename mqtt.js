const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")

console = consoleFormatter(console)

class MqttToBroker{
    constructor (){
        var _inst = this
        const PREFIX = "MQTT"

        process.stdout.write("\x1Bc")
        log(Array(process.stdout.rows + 1).join('\n'));

        const mqtt = require('mqtt')

        const host = '167.71.159.65'
        const port = '1883'
        const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

        const connectUrl = `mqtt://${host}:${port}`
        const mqtt_client = mqtt.connect(connectUrl, {
            clientId,
            clean: true,
            connectTimeout: 4000,
            username: 'tft100',
            password: 'S8Y5mvDdGGWjxj5h',
            reconnectPeriod: 1000,
        })

        const topic = '/tft100-server/+/command'
        //const topic_subscribe = '/nodejs/mqtt/tft100-server/commands'
        mqtt_client.on('connect', () => {
            log('Connected, client ID: ' + clientId)
            mqtt_client.subscribe([topic], () => {
                log(`Subscribe to topic '${topic}'`)
        })
        /*mqtt_client.publish(topic, 'sendCommand 1 getio', { qos: 0, retain: false }, (error) => {
            if (error) {
            console.error(error)
            }
            })*/
        })
        mqtt_client.on('message', (topic, payload) => {
            log('Received Message:', topic, payload.toString())

            let d = payload.toString()

            let devlist_path = ('./device/devlist.json')
            let devlist_json = require(devlist_path)
            let devices = {}
            

            for (const [key, device] of Object.entries(devlist_json['devices'])) {
                devices[device.id] = device.name
            }

            let user_input = d.toString().trim()
            //log("you entered: [" +    user_input + "]");
            let [ui_command, tmp, ...others] = user_input.split(" ");
            let message = others.join(" ");

            //log("Command: " + comm);
            //log("ID: " + id);
            //log("Message: " + message);

            if (ui_command == "sendCommand"){
                client.write(d)
            }
            else if (ui_command == "setDeviceName"){
                client.write(d)
            }
            else if (ui_command == "getGpsAll"){
                client.write(d)
            }
        })

        // Port 49365 for sending ui commands to logger module
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
            intervalConnect = setInterval(connect, 2000)
        }

        function clearIntervalConnect() {
            if(false == intervalConnect) return
            clearInterval(intervalConnect)
            intervalConnect = false
        }

        client.on('data', (data) => {     
            log(`Received from LOGGER: ${data}`); 

            let [id, ...dump] = data.toString().split(":\n")
            let response = dump.join("")
            if(id == -2){
                mqtt_client.publish('/tft100-server/all-gps', response, { qos: 0, retain: true }, (error) => {
                    if (error) {
                    console.error(error)
                    }
                })
            }
            else{
                mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
                    if (error) {
                    console.error(error)
                    }
                })
            }
            //log(`Response from dev ${id}:` + response)
            
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

        connect()

        function log (message){
            console.log(`[${PREFIX}] `, message);
        }

    }

}


inst_mqtt = new MqttToBroker()








