const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const { parse } = require('path');
const ByteBuffer = require("bytebuffer");
const Devices = require('./device/devices')
const prompt = require('prompt-sync')
const crc16ibm = require('./utilities/crc16ibm')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")


class UI{
    constructor (){
        this.devices = new Devices()
        let server = net.createServer((c) => {
            //console.log("client connected");
            //console.log(c)
            //let id = this.devices.addDevice(c);
            //console.log("New device connected")
            //console.log("ID: " + id)
            //console.log("IP: " + c.remoteAddress + ":" + c.remotePort)

            //c.id = id++; 
            c.on('end', () => {
                let id = this.devices.getDeviceBySocket(c).id
                console.log("Device " + id + " disconnected");
                this.devices.setDeviceReady(id, false);
                //this.devices.removeDeviceBySocket(c);
                //clients
            });
        
            c.on('data', (data) => {
                //console.log("Received: " + data.toString("hex"));
                //console.log("Received data from Address: " + c.remoteAddress + ":" + c.remotePort);
                
                //console.log("From Device " + id);
                //console.log(c)

                
                let buffer = data;
                let parser = new Parser(buffer);
                if(parser.isImei){
                    let dev = this.devices.getDeviceByImei(parser.imei)
                    if (dev){
                        dev.updateSocket(c)
                        this.devices[dev.id] = dev
                        console.log("Device " + dev.id + " reconnected")
                    }
                    else{
                        id = this.devices.addDevice(parser.imei, c)
                        console.log("New device " + id + " added")
                        console.log("IMEI of new device: " + parser.imei)
                    }
                    //console.log("Received IMEI from device " + id);
                    c.write(Buffer.alloc(1,1));
                }else {
                    let device = this.devices.getDeviceBySocket(c)
                    let id = device.id
                    let header = parser.getHeader();
                    //console.log("CODEC: " + header.codec_id);
        
                    if(header.codec_id == 12){
                        console.log("Received GPRS message from device  " + id)
                        let gprs = parser.getGprs()
                        console.log("Type: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
                    }
                    else if(header.codec_id == 142){
                        let avl = parser.getAvl()

                        console.log("Received AVL data from device " + id);
                        //console.log("AVL Zero: " + avl.zero);
                        console.log("AVL Data Length: " + avl.data_length);
                        //console.log("AVL Codec ID: " + avl.codec_id);
                        console.log("AVL Number of Data: " + avl.number_of_data);
                        let writer = new binutils.BinaryWriter();
                        writer.WriteInt32(avl.number_of_data);
        
                        let response = writer.ByteBuffer;
                        c.write(response);

                        if(!device.isReady){
                            this.devices.setDeviceReady(id)
                            console.log("Device " + id + " is ready for communication")
                        }
                        
                        //console.log("Writing response to AVL: " + response.toString("hex"));
                    }
                        
                }
            });
        });
        
        
        server.listen(49366, () => {
            console.log("Server started");
        });

        
        
        
    }

}

ui_inst = new UI()
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    let user_input = d.toString().trim()
    //console.log("you entered: [" +    user_input + "]");
    let [ui_command, id, ...others] = user_input.split(" ");
    let message = others.join(" ");

    //console.log("Command: " + comm);
    //console.log("ID: " + id);
    //console.log("Message: " + message);

    if (ui_command == "sendCommand"){
        gprsCommandPacker = new GprsCommandPacker(message)
        let outBuffer = gprsCommandPacker.getGprsMessageBuffer()

        if (ui_inst.devices.getDeviceByID(id) !== undefined){
            ui_inst.devices.sendMessageToDevice(id, outBuffer);
        }
        else{
            console.log("Device " + id + " not found")
        }
    }
    
    
    
});


