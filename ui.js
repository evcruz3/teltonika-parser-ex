const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const { parse } = require('path');
const ByteBuffer = require("bytebuffer");
const Devices = require('./device/devices')
const prompt = require('prompt-sync')
const crc16ibm = require('./utilities/crc16ibm')


class UI{
    constructor (){
        this.devices = new Devices()
        let server = net.createServer((c) => {
            console.log("client connected");
            //console.log(c)
            this.devices.addDevice(c);

            //c.id = id++; 
            c.on('end', () => {
                let id = this.devices.getDeviceBySocket(c).id
                console.log("Device " + id + " disconnected");
                this.devices.removeDeviceBySocket(c);
                //clients
            });
        
            c.on('data', (data) => {
                //console.log("Received: " + data.toString("hex"));
                //console.log("Received data from Address: " + c.remoteAddress + ":" + c.remotePort);
                let device = this.devices.getDeviceBySocket(c)
                let id = device.id
                console.log("From Device " + id);
                //console.log(c)

                
                let buffer = data;
                let parser = new Parser(buffer);
                if(parser.isImei){
                    console.log("Received IMEI for device " + id);
                    c.write(Buffer.alloc(1,1));
                }else {
                    let header = parser.getHeader();
                    //console.log("CODEC: " + header.codec_id);
        
                    if(header.codec_id == 12){
                        console.log("Received GPRS message from device  " + id)
                        let gprs = parser.getGprs()
                        console.log("Type: " + gprs.type + "; Size: " + gprs.size + "; Message: " + gprs.response)
                    }
                    else if(header.codec_id == 142){
                        let avl = parser.getAvl()

                        console.log("Received AVL data from device " + id);
                        console.log("AVL Zero: " + avl.zero);
                        console.log("AVL Data Length: " + avl.data_length);
                        console.log("AVL Codec ID: " + avl.codec_id);
                        console.log("AVL Number of Data: " + avl.number_of_data);
                        let writer = new binutils.BinaryWriter();
                        writer.WriteInt32(avl.number_of_data);
        
                        let response = writer.ByteBuffer;
                        c.write(response);
                        this.devices.setDeviceReady(id)
                        console.log("Device " + id + "is now ready for communication")
                        //console.log("Writing response to AVL: " + response.toString("hex"));
                    }
                        
                }
            });
        });
        
        
        server.listen(49366, () => {
            console.log("Server started");
        });

        
        
        
    }

    sendMessage(c){
        //var user_input = prompt("Input a command: ")

        let writer = new binutils.BinaryWriter();
        let command = Buffer.from("000000000000000F0C010500000007676574696E666F0100004312", "hex");
        //console.log("Current buffer length: " + writer.Length);
        writer.WriteBytes(command);
        let command_message = writer.ByteBuffer;
        //let response = ByteBuffer.fromHex("000000000000000F0C010500000007676574696E666F0100004312")
        console.log("Writing test command " + command_message.toString("hex"));
        c.write(command_message);

        //this.dev0 = this.devices.getDeviceByID(0);
        //this.dev0.socket.write(command_message)
    }
}

ui_inst = new UI()
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    let user_input = d.toString().trim()
    console.log("you entered: [" + 
        user_input + "]");
    let [comm, id, ...others] = user_input.split(" ");
    let message = others.join(" ");

    console.log("Command: " + comm);
    console.log("ID: " + id);
    console.log("Message: " + message);

    let command = Buffer.from(message);
    let prefix = Buffer.from('00000000', "hex"); // JavaScript allows hex numbers.
    let dataSize = Buffer.from((Buffer.byteLength(command) + 8).toString(16).padStart(8, '0'), "hex");
    var codecID = Buffer.from('0C', "hex");
    var cq1 = Buffer.from('01', "hex");
    var commandType = Buffer.from('05', "hex");
    var commandSize = Buffer.from((Buffer.byteLength(command)).toString(16).padStart(8, '0'), "hex");
    var cq2 = Buffer.from('01', "hex");
    // compute the required buffer length
    //var bufferSize = 4 + dataSize;
    //var buffer = Buffer.from()
    // prefix, dataSize, codecID, cq1, commandType, commandSize, command, cq2, crc
    var encoded_message = Buffer.concat([codecID, cq1, commandType, commandSize, command, cq2])
    //console.log(encoded_message.toString("hex"))

    var crc = Buffer.from(crc16ibm(encoded_message).toString(16).padStart(8, '0'), "hex");
    //console.log(crc.toString("hex"))

    var outBuffer = Buffer.concat([prefix, dataSize, encoded_message, crc])

    if (ui_inst.devices.getDeviceByID(id) !== undefined){
        ui_inst.devices.sendMessageToDevice(id, outBuffer);
    }
    else{
        console.log("Device " + id + " not found")
    }
    
    // let device = ui_inst.devices.getDeviceByID(id);
    // if(dev){
    //     ui_inst.sendMessage(device.socket);
    // }
    
    
});


