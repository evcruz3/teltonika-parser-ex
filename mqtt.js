const net = require('net');
const consoleFormatter = require("./utilities/consoleFormatter")
const mqtt = require('mqtt')

console = consoleFormatter(console)

class MqttToBroker{
    constructor (){
        var _inst = this
        const PREFIX = "MQTT"

        process.stdout.write("\x1Bc")
        log(Array(process.stdout.rows + 1).join('\n'));

        
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

        const allowed_commands = ['sendCommand', 'setDeviceName']
        const topic = '/tft100-server/+/command'
        mqtt_client.on('connect', () => {
            log('Connected, client ID: ' + clientId)
            mqtt_client.subscribe([topic], () => {
                log(`Subscribe to topic '${topic}'`)
            })
        })
        mqtt_client.on('message', (topic, payload) => {
            
            let d = payload.toString()

            let user_input = d.toString().trim()
            log('Received Message from ' + topic.toString() + ": " + user_input)

            let ui_command = user_input.split(" ")[0];
            
            if (allowed_commands.includes(ui_command)){
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
            intervalConnect = setInterval(connect, 5000)
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
            // if(id == -2){
            //     mqtt_client.publish('/tft100-server/all-gps', response, { qos: 0, retain: true }, (error) => {
            //         if (error) {
            //         console.error(error)
            //         }
            //     })
            // }
            // else{
            mqtt_client.publish('/tft100-server/'+id+'/response', response, { qos: 0, retain: false }, (error) => {
                if (error) {
                console.error(error)
                }
            })
            // }
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

        client.setTimeout(30000)
        client.on('timeout', () => {
            log("TIMED OUT")
        })

        connect()

        function log (message){
            console.log(`[${PREFIX}] `, message);
        }

    }

}


inst_mqtt = new MqttToBroker()








