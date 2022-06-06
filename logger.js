const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const Devices = require('./device/devices')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")
const fs = require('fs')
const consoleFormatter = require("./utilities/consoleFormatter")

console = consoleFormatter(console)

class Logger{
    /*
     * COMMUNICATION PORTS
     * 
     * 49364 - logger <-> ui
     * 49365 - logger <-> mqtt
     * 49366 - logger <-> tft-devices
     * 
     */
    constructor (){
        const PREFIX = "LOGGER"

        function log (message){
            console.log(`[${PREFIX}] `, message);
        }

        this.devices = new Devices()
        this.devlist_path = ('./device/devlist.json')
        this.devlist_json = require(this.devlist_path)
        var inst = this
        this.requests = {}
        this.dev_names = []
        
        // Load all devices to a runtime object 'Devices'
        for (const [key, device] of Object.entries(this.devlist_json['devices'])) {
            this.devices.addDevice(device.imei, null, device.id)
            if("name" in device){
                this.dev_names.push(device.name)
            }
            log("Device " + device.id + " loaded")
        }

        
        // Define methods for device connections
        let server = net.createServer((c) => {
            c.on('end', () => {
                let id = this.devices.getDeviceBySocket(c).id
                log("Device " + id + " disconnected");
                this.devices.setDeviceReady(id, false);
                //this.devices.removeDeviceBySocket(c);
                //clients
            });
        
            c.on('data', (data) => {
                
                let buffer = data;
                let parser = new Parser(buffer);
                if(parser.isImei){
                    let id = -1
                    let dev = this.devices.getDeviceByImei(parser.imei)
                    if (dev){
                        dev.updateSocket(c)
                        id = dev.id
                        this.devices[id] = dev
                        log("Device " + id + " reconnected")

                        
                        
                        
                    }
                    else{
                        id = this.devices.addDevice(parser.imei, c)
                        log("New device added; ID: " + id + "; IMEI: " + parser.imei)   
                        this.devlist_json['devices'].push({"id":id,"imei":parser.imei,"name":""});
                        let stream = fs.createWriteStream(this.devlist_path, {flags:'w'});
                        stream.write(JSON.stringify(this.devlist_json))
                    }
                    
                    //log("Received IMEI from device " + id);
                    c.write(Buffer.alloc(1,1));
                   
                    this.devices.setDeviceReady(id)
                    log("Device " + id + " is online") 

                    let requests = this.requests[id]
                    if(requests !== undefined){
                        requests.forEach(function(item, index, object) {
                            let now = new Date()
                            let diff = (now.getTime() - item.timestamp.getTime())/1000

                            if (diff <= 30){
                                dev.sendCommand(item.outBuffer)
                                log("Pending message sent to dev " + id)
                            }
                            else{
                                object.splice(index, 1);
                            }
                        });
                    }
                }
                else {
                    let device = this.devices.getDeviceBySocket(c)
                    let id = device.id
                    let header = parser.getHeader();
                    //log("CODEC: " + header.codec_id);
        
                    if(header.codec_id == 12){
                        log("Received GPRS message from device  " + id)
                        let gprs = parser.getGprs()
                        
                        
                        log("Type: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
                        inst.send_to_ui(inst, id, gprs)
                        //this.devices.pushGprsRecord(id, gprs);
                    }
                    else if(header.codec_id == 142){
                        let avl = parser.getAvl()                   

                        let writer = new binutils.BinaryWriter();
                        writer.WriteInt32(avl.number_of_data);
        
                        let response = writer.ByteBuffer;
                        c.write(response);

                        log("Received AVL data from device " + id);
                        let now = new Date();
                        let tmp_filename = `dev${id}-${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.txt`

                        let tmp_path = `devlogs/${id}/`

                        if (!fs.existsSync(tmp_path)){
                            fs.mkdirSync(tmp_path, { recursive: true });
                        }

                        let recordlength = avl.records.length
                        let record = avl.records[recordlength-1]
                        this.devices.gpsDevices["timestamp"] = record.timestamp
                        this.devices.gpsDevices[id] = {"gps" : {"timestamp" : record.timestamp, "latitude" : record.gps.latitude, "longitude" : record.gps.longitude}}
                        let stream = fs.createWriteStream(`${tmp_path}${tmp_filename}`, {flags:'a'});
                        stream.write(data.toString("hex")+"\n");
                    }
                        
                }
            });
        });
        
        
        server.listen(49366, () => {
            log("Teltonika Server started");
        }); 




        // Create port to listen to system commands
        //this.clients = []
        this.client = null
        let commandReceiver = net.createServer((c) => {
            c.on("end", () => {
                log("ui disconnected")
            });

            c.on('data', (ui_message) => {
                log("ui message: " + ui_message)
                this.client = c
                inst._process_message(ui_message, c, inst)
                //log("Clients: " + inst.clients)
            }); 

        })
        
        commandReceiver.listen(49365, () => {
            log("Waiting for command from ui...")
        })

        // For sending GPRS responses to ui
        
    }

    send_to_ui(inst, id, gprs){
        /*let client = new net.Socket();

        client.connect(49364, 'localhost', () => {
           inst.log("Created a connection to ui node")
        })*/
        //let client = inst.clients.pop()

        let client = inst.client

        if (client !== undefined && client !== null){
            client.on('data', (data) => {     
                console.log(`[LOGGER]  Logger received: ${data}`); 
            });  
            // Add a 'close' event handler for the client socket 
            client.on('close', () => { 
                console.log('[LOGGER]  UI closed'); 
            });  
            client.on('error', (err) => { 
                console.error(err); 
            }); 
            client.write(id + ":\nType: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
            //client.end()
        }

        
    }

    _process_message(ui_message, c, inst){
        //let inst = this
        let user_input = ui_message.toString().trim()
        let [ui_command, tmp, ...others] = user_input.split(" ");
        let message = others.join(" ");

        

        //inst.log("Command: " + comm);
        //inst.log("ID: " + id);
        //inst.log("Message: " + message);

        if (ui_command == "sendCommand"){
            let gprsCommandPacker = new GprsCommandPacker(message)
            let outBuffer = gprsCommandPacker.getGprsMessageBuffer()

            if(isNaN(tmp)){
                var dev = inst.devices.getDeviceByName(tmp)
            }
            else{
                var dev = inst.devices.getDeviceByID(tmp)
            }

            //let id = dev.id

            if (dev !== undefined && dev !== null){
                if(dev.isReady){
                    c.write("-1:\n'" + message + "' sent to device " + tmp);
                    dev.sendCommand(outBuffer)
                    //inst.devices.sendMessageToDevice(id, outBuffer);
                }
                else{
                    c.write(dev.id + ":\nDevice " + tmp + " is currently offline, will send once the device go online")
                    let timestamp = new Date()
                    
                    inst.requests[dev.id] = []
                    inst.requests[dev.id].push({"timestamp" : timestamp, "buffer" : outBuffer})
                    //inst.clients.pop()
                }
                
            }
            else{
                c.write("-1:\nDevice " + tmp + " not found")
                //inst.clients.pop()
            }

            
        }
        else if (ui_command == "listDevices"){
            inst.devices.printDevices(c)
            //inst.clients.pop()
        }
        else if(ui_command == "setDeviceName"){
            let dev_name = others[0]
            if(isNaN(tmp)){
                var dev = inst.devices.getDeviceByName(tmp)
            }
            else{
                var dev = inst.devices.getDeviceByID(tmp)
            }

            let id = dev.id

            if(dev_name in inst.dev_names){
                c.write(`${id}:\n`+dev_name + "already in use, please use another name")
            }
            else{
                inst.devlist_json['devices'][id].name = dev_name
                let stream = fs.createWriteStream(inst.devlist_path, {flags:'w'});
                stream.write(JSON.stringify(inst.devlist_json))
                dev.setName(dev_name)
                c.write(`${id}:\nDevice ` + tmp + " set to '" + dev_name + "'")
                
            }
            //inst.clients.pop()
        }
        else if(ui_command == "getGpsAll"){
            c.write(`-2:\n` + JSON.stringify(inst.devices.gpsDevices))
            //inst.clients.pop()
        }
        //inst.log("Clients: " + inst.clients)
    }

}

module.exports = Logger
