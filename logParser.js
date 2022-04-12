const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const { parse } = require('path');
const ByteBuffer = require("bytebuffer");
const Devices = require('./device/devices')
const prompt = require('prompt-sync')
const crc16ibm = require('./utilities/crc16ibm')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")
const fs = require('fs')
const myRL = require("serverline")

class logParser{
    constructor (filename){
        this.devices = new Devices()
        var id = this.devices.addDevice("dev1", null)
        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(filename)
          });
          
          lineReader.on('line', function (data) {
            let buffer = Buffer.from(data, "hex");
            let parser = new Parser(buffer);
            //let device = this.devices.getDeviceBySocket(c)
            //let id = device.id
            //let id = 1
            let header = parser.getHeader();
            //console.log("CODEC: " + header.codec_id);

            if(header.codec_id == 12){
                console.log("Received GPRS message from device  " + id)
                let gprs = parser.getGprs()
                

                console.log("Type: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
                this.devices.pushGprsRecord(id, gprs);
            }
            else if(header.codec_id == 142){
                let avl = parser.getAvl()

                console.log("Received AVL data from device " + id);
                //let stream = fs.createWriteStream("dev"+id+"-log.txt", {flags:'a'});
                //stream.write(data.toString("hex")+"\n");
                //console.log("AVL Zero: " + avl.zero);
                console.log("AVL Data Length: " + avl.data_length);
                //console.log("AVL Codec ID: " + avl.codec_id);
                console.log("AVL Number of Data: " + avl.number_of_data);
                console.log("AVL Data timestamp: " + avl.records[-1].timestamp)
                this.devices.pushAvlRecord(id, avl);
                //let writer = new binutils.BinaryWriter();
                //writer.WriteInt32(avl.number_of_data);

                // response = writer.ByteBuffer;
                //c.write(response);
            }
                    //console.log('Line from file:', line);
        });

    }

}

ui_inst = new logParser('dev1-log.txt')
//var stdin = process.openStdin();
//process.stdout.write("\x1Bc")
//console.log(Array(process.stdout.rows + 1).join('\n'));

//myRL.init()
//myRL.setCompletion(['sendCommand', 'listDevices', 'printLatestGPRS']);
//myRL.on('line', function(d) {
//     let user_input = d.toString().trim()
//     //console.log("you entered: [" +    user_input + "]");
//     let [ui_command, id, ...others] = user_input.split(" ");
//     let message = others.join(" ");

//     //console.log("Command: " + comm);
//     //console.log("ID: " + id);
//     //console.log("Message: " + message);

//     if (ui_command == "sendCommand"){
//         gprsCommandPacker = new GprsCommandPacker(message)
//         let outBuffer = gprsCommandPacker.getGprsMessageBuffer()

//         let dev = ui_inst.devices.getDeviceByID(id)

//         if (dev !== undefined){
//             if(dev.isReady){
//                 console.log("Sending '" + message + "' to device " + id + "...");
//                 ui_inst.devices.sendMessageToDevice(id, outBuffer);
//             }
//             else{
//                 console.log("Device " + id + " is currently disconnected")
//             }
            
//         }
//         else{
//             console.log("Device " + id + " not found")
//         }
//     }
//     else if (ui_command == "listDevices"){
//         //console.log("TODO: list all devices here and their status")
//         ui_inst.devices.printDevices()
//     }
//     else if (ui_command == "printLatestGPRS"){
//         if(id){
//             ui_inst.devices.printLatestGprs(id)
//         }
//         else{
//             console.log("Please specify a device id")
//         }
//     }
    
    
    
// });
// stdin.addListener("data", function(d) {
//     // note:  d is an object, and when converted to a string it will
//     // end with a linefeed.  so we (rather crudely) account for that  
//     // with toString() and then trim() 
    
// });


