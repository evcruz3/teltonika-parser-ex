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
    constructor (){
        this.devices = new Devices()
        var devlist_path = ('./device/devlist.json')
        this.devlist_json = require(devlist_path)
        var inst = this
        this.dev_names = []
        
        for (const [key, device] of Object.entries(this.devlist_json['devices'])) {
            this.devices.addDevice(device.imei, null, device.id)
            if("name" in device){
                this.dev_names.push(device.name)
            }
            console.log("Device " + device.id + " loaded")
        }
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
                        let stream = fs.createWriteStream(devlist_path, {flags:'w'});
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

                        console.log("Received AVL data from device " + id);
                        let stream = fs.createWriteStream("dev"+id+"-log.txt", {flags:'a'});
                        stream.write(data.toString("hex")+"\n");
                        let writer = new binutils.BinaryWriter();
                        writer.WriteInt32(avl.number_of_data);
        
                        let response = writer.ByteBuffer;
                        c.write(response);
                    }
                        
                }
            });
        });
        
        
        server.listen(49366, () => {
            console.log("Server started");
        });

        let commandReceiver = net.createServer((c) => {
            c.on("end", () => {
                console.log("ui disconnected")
            });

            c.on('data', (ui_message) => {
                console.log("ui message: " + ui_message)
                //c.write("SAMPLE RESPONSE FROM LOGGER")
                inst._process_message(ui_message, c, inst)
            });
        })

        commandReceiver.listen(49365, () => {
            console.log("Waiting for command from ui...")
        })

        // For sending GPRS responses to ui
        
    }

    send_to_ui(inst, id, gprs){
        let client = new net.Socket();

        client.connect(49364, 'localhost', () => {
            console.log("Created a connection to ui node")
        })

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
        client.write("From dev " + id + "\nType: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
        client.end()
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

            if (dev !== undefined){
                if(dev.isReady){
                    c.write("'" + message + "' sent to device " + tmp);
                    dev.sendCommand(outBuffer)
                    //inst.devices.sendMessageToDevice(id, outBuffer);
                }
                else{
                    c.write("Device " + tmp + " is currently disconnected")
                }
                
            }
            else{
                c.write("Device " + tmp + " not found")
            }
        }
        else if (ui_command == "listDevices"){
            inst.devices.printDevices(c)
        }
        else if(ui_command == "setDeviceName"){
            let dev_name = others[0]

            

            if(dev_name in inst.dev_names){
                c.write(dev_name + "already in use, please use another name")
            }
            else{

                if(isNaN(tmp)){
                    var dev = inst.devices.getDeviceByName(tmp)
                }
                else{
                    var dev = inst.devices.getDeviceByID(tmp)
                }

                let id = dev.id

                inst.devlist_json['devices'][id].name = dev_name
                let stream = fs.createWriteStream(devlist_path, {flags:'w'});
                stream.write(JSON.stringify(inst.devlist_json))
                dev.setName(dev_name)
                c.write("Device " + tmp + " set to '" + dev_name + "'")
                
            }
        }
    }

}

inst = new Logger()
