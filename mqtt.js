const net = require('net');
const formatConsole = require("./utilities/formatConsole")

console.log = formatConsole(console.log)

class MqttToBroker{
    constructor (){
        var _inst = this

        process.stdout.write("\x1Bc")
        console.log(Array(process.stdout.rows + 1).join('\n'));

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
            console.log('Connected, client ID: ' + clientId)
            mqtt_client.subscribe([topic], () => {
                console.log(`Subscribe to topic '${topic}'`)
        })
        /*mqtt_client.publish(topic, 'sendCommand 1 getio', { qos: 0, retain: false }, (error) => {
            if (error) {
            console.error(error)
            }
            })*/
        })
        mqtt_client.on('message', (topic, payload) => {
            console.log('Received Message:', topic, payload.toString())

            let d = payload.toString()

            let devlist_path = ('./device/devlist.json')
            let devlist_json = require(devlist_path)
            let devices = {}
            

            for (const [key, device] of Object.entries(devlist_json['devices'])) {
                devices[device.id] = device.name
            }

            let user_input = d.toString().trim()
            //console.log("you entered: [" +    user_input + "]");
            let [ui_command, tmp, ...others] = user_input.split(" ");
            let message = others.join(" ");

            //console.log("Command: " + comm);
            //console.log("ID: " + id);
            //console.log("Message: " + message);

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
            console.log(`Client received: ${data}`); 

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
            //console.log(`Response from dev ${id}:` + response)
            

            if (data.toString().endsWith('exit')) { 
                client.destroy(); 
            } 
        });  
        // Add a 'close' event handler for the client socket 
        client.on('close', () => { 
            console.log('logger closed'); 
            launchIntervalConnect()
            
        });  
        client.on('error', (err) => { 
            console.error(err); 
            launchIntervalConnect()
        }); 
        client.on('error', () => { 
            launchIntervalConnect()
        }); 

        client.on('connect', () => {
            clearIntervalConnect()
            console.log("Created a connection to ui node")

        })

        connect()

    }

}

ui_inst = new MqttToBroker()








