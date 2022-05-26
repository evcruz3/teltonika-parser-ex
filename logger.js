const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const Devices = require('./device/devices')
const prompt = require('prompt-sync')
const crc16ibm = require('./utilities/crc16ibm')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")
const fs = require('fs')
const myRL = require("serverline")
//require('log-timestamp')
//process.env.TZ = "Asia/Manila"

const originalConsoleLog = console.log;
console.log = function() {
    args = [];
    args.push( '[' + (new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})) + '] ' );
    // Note: arguments is part of the prototype
    for( var i = 0; i < arguments.length; i++ ) {
        args.push( arguments[i] );
    }
    originalConsoleLog.apply( console, args );
};

class Logger{
    /*
     * COMMUNICATION PORTS
     * 
     * 49365 - ui <-> logger / mqtt
     * 49366 - logger <-> tft-devices
     * 
     */
    constructor (){
        this.devices = new Devices()
        this.devlist_path = ('./device/devlist.json')
        this.devlist_json = require(this.devlist_path)
        var inst = this
        this.dev_names = []
        
        // Load all devices to a runtime object 'Devices'
        for (const [key, device] of Object.entries(this.devlist_json['devices'])) {
            this.devices.addDevice(device.imei, null, device.id)
            if("name" in device){
                this.dev_names.push(device.name)
            }
            console.log("Device " + device.id + " loaded")
        }

        
        // Define methods for device connections
        let server = net.createServer((c) => {
            c.on('end', () => {
                let id = this.devices.getDeviceBySocket(c).id
                console.log("Device " + id + " disconnected");
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
                        console.log("Device " + id + " reconnected")
                    }
                    else{
                        id = this.devices.addDevice(parser.imei, c)
                        console.log("New device added; ID: " + id + "; IMEI: " + parser.imei)   
                        this.devlist_json['devices'].push({"id":id,"imei":parser.imei,"name":""});
                        let stream = fs.createWriteStream(this.devlist_path, {flags:'w'});
                        stream.write(JSON.stringify(this.devlist_json))
                    }
                    
                    //console.log("Received IMEI from device " + id);
                    c.write(Buffer.alloc(1,1));
                   
                    this.devices.setDeviceReady(id)
                    console.log("Device " + id + " is ready for communication") 
                }
                else {
                    let device = this.devices.getDeviceBySocket(c)
                    let id = device.id
                    let header = parser.getHeader();
                    //console.log("CODEC: " + header.codec_id);
        
                    if(header.codec_id == 12){
                        console.log("Received GPRS message from device  " + id)
                        let gprs = parser.getGprs()
                        
                        
                        console.log("Type: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
                        inst.send_to_ui(inst, id, gprs)
                        //this.devices.pushGprsRecord(id, gprs);
                    }
                    else if(header.codec_id == 142){
                        let avl = parser.getAvl()                   

                        let writer = new binutils.BinaryWriter();
                        writer.WriteInt32(avl.number_of_data);
        
                        let response = writer.ByteBuffer;
                        c.write(response);

                        console.log("Received AVL data from device " + id);
                        let now = new Date();
                        let tmp_filename = `dev${id}-${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.txt`

                        let tmp_path = `devlogs/${id}/`

                        if (!fs.existsSync(tmp_path)){
                            fs.mkdirSync(tmp_path, { recursive: true });
                        }

                        this.devices.gpsDevices[id].timestamp = avl.timestamp
                        this.devices.gpsDevices[id].gps.altitude = avl.gps.altitude
                        this.devices.gpsDevices[id].gps.longitude = avl.gps.longitude
                        let stream = fs.createWriteStream(`${tmp_path}${tmp_filename}`, {flags:'a'});
                        stream.write(data.toString("hex")+"\n");
                    }
                        
                }
            });
        });
        
        
        server.listen(49366, () => {
            console.log("Server started");
        });


        // Create port to listen to system commands
        this.clients = []
        let commandReceiver = net.createServer((c) => {
            c.on("end", () => {
                console.log("ui disconnected")
            });

            c.on('data', (ui_message) => {
                console.log("ui message: " + ui_message)
                inst.clients.push(c)
                inst._process_message(ui_message, c, inst)
            });
        })
        commandReceiver.listen(49365, () => {
            console.log("Waiting for command from ui...")
        })

        // For sending GPRS responses to ui
        
    }

    send_to_ui(inst, id, gprs){
        /*let client = new net.Socket();

        client.connect(49364, 'localhost', () => {
            console.log("Created a connection to ui node")
        })*/
        let client = inst.clients.pop()

        if (client !== undefined){
            client.on('data', (data) => {     
                console.log(`Logger received: ${data}`); 
                if (data.toString().endsWith('exit')) { 
                    client.destroy(); 
                } 
            });  
            // Add a 'close' event handler for the client socket 
            client.on('close', () => { 
                console.log('UI closed'); 
            });  
            client.on('error', (err) => { 
                console.error(err); 
            }); 
            client.write(id + ":\nType: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
            client.end()
        }

        
    }

    _process_message(ui_message, c, inst){
        //let inst = this
        let user_input = ui_message.toString().trim()
        let [ui_command, tmp, ...others] = user_input.split(" ");
        let message = others.join(" ");

        

        //console.log("Command: " + comm);
        //console.log("ID: " + id);
        //console.log("Message: " + message);

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
                    c.write(dev.id + ":\nDevice " + tmp + " is currently disconnected")
                    inst.clients.pop()
                }
                
            }
            else{
                c.write("-1:\nDevice " + tmp + " not found")
                inst.clients.pop()
            }

            
        }
        else if (ui_command == "listDevices"){
            inst.devices.printDevices(c)
            inst.clients.pop()
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
            inst.clients.pop()
        }
        else if(ui_command == "getGpsAll"){
            c.write(`-1:\n` + JSON.stringify(inst.devices.gpsDevices))
        }
    }

}

inst = new Logger()
