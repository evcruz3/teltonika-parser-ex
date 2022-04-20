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

class UI{
    constructor (){
        //this.devices = new Devices()

        var devlist_path = ('./device/devlist.json')
        var devlist_json = require(devlist_path)
        this.devices = {}
        var _inst = this

        for (const [key, device] of Object.entries(devlist_json['devices'])) {
            this.devices[device.id] = device.imei
        }

        process.stdout.write("\x1Bc")
        console.log(Array(process.stdout.rows + 1).join('\n'));

        myRL.init()
        myRL.setCompletion(['sendCommand', 'listDevices', 'printLatestGPRS', 'printLatestAVL']);
        myRL.on('line', function(d) {

            let user_input = d.toString().trim()
            //console.log("you entered: [" +    user_input + "]");
            let [ui_command, id, ...others] = user_input.split(" ");
            let message = others.join(" ");

            //console.log("Command: " + comm);
            //console.log("ID: " + id);
            //console.log("Message: " + message);

            if (ui_command == "sendCommand"){
                _inst.client.write(d)
            }
            else if (ui_command == "listDevices"){
                //console.log("TODO: list all devices here and their status")
                _inst.client.write(d)
            }
            else if (ui_command == "printLatestGPRS"){
                _inst.client.write(d)
            }
            else if (ui_command == "printLatestAVL"){
                _inst.client.write(d)
            }
            else if (ui_command == "displayLog"){
                if(id in _inst.devices){
                    _displayLog(id)
                }
                else{
                    console.log("Device not found / specified")
                }
            }
            
            
        });


        //var id = this.devices.addDevice("dev0", null)
        //var _self = this
        

        this.client = new net.Socket();

        this.client.connect(49365, 'localhost', () => {
            console.log("Created a connection to ui node")
        })

        this.client.on('data', (data) => {     
            console.log(`Client received: ${data}`); 
            if (data.toString().endsWith('exit')) { 
                client.destroy(); 
            } 
        });  
        // Add a 'close' event handler for the client socket 
        this.client.on('close', () => { 
            console.log('Client closed'); 
        });  
        this.client.on('error', (err) => { 
            console.error(err); 
        }); 

    }

    _displayLog(id){
        //let devices = new Devices()
        //devices.addDevice(null, null, id)
        let filename = "dev"+id+"-log.txt"
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
                //devices.pushGprsRecord(id, gprs);
            }
            else if(header.codec_id == 142){
                let avl = parser.getAvl()

                console.log("Received AVL data from device " + id);
                //let stream = fs.createWriteStream("dev"+id+"-log.txt", {flags:'a'});
                //stream.write(data.toString("hex")+"\n");
                //console.log("AVL Zero: " + avl.zero);
                console.log("AVL Data Length: " + avl.data_length);
                //console.log("AVL Codec ID: " + avl.codec_id);
                //console.log("AVL Number of Data: " + avl.number_of_data);
                //console.log("AVL Data timestamp: " + avl.records[0].timestamp)
                for (var i = 0; i < avl.number_of_data; i++) {
                    this._printAvlRecord(avl.records, i);
                }
                
                //devices.pushAvlRecord(id, avl);
                //let writer = new binutils.BinaryWriter();
                //writer.WriteInt32(avl.number_of_data);

                // response = writer.ByteBuffer;
                //c.write(response);
            }
                    //console.log('Line from file:', line);
        });
    }

    _printAvlRecord(avlRecords, index){
        let avlRecord = avlRecords[index]
  
        //console.log("KEYS: " + Object.keys(avlRecord))
        if(socket){
           socket.write("Timestamp: " + avlRecord.timestamp)
           socket.write("Priority: " + avlRecord.priority)
           for (const [key, value] of Object.entries(avlRecord.gps)) {
              socket.write(`GPS ${key}: ${value}`);
           }
           //console.log("GPS: " + avlRecord.gps)
           socket.write("Event ID: " + avlRecord.event_id)
           if(avlRecord.event_id != 385){
              socket.write("Properties Count " + avlRecord.properties_count)
              for (const [key, element] of Object.entries(avlRecord.ioElements)) {
                 for (const [property, val] of Object.entries(element)) {
                    socket.write(`IO Element ${key} ${property}: ${val}`);
                    if (property == "value"){
                       for (const [prop, v] of Object.entries(val)) {
                          socket.write(`IO Element ${key} ${property} ${val} ${prop}: ${v}`);
                       }
                    }
                 }
                 //console.log(`IO Element ${key}: ${value}`);
              }
           }
        }
        else{
           console.log("Timestamp: " + avlRecord.timestamp)
           console.log("Priority: " + avlRecord.priority)
           for (const [key, value] of Object.entries(avlRecord.gps)) {
              console.log(`GPS ${key}: ${value}`);
           }
           //console.log("GPS: " + avlRecord.gps)
           console.log("Event ID: " + avlRecord.event_id)
           if(avlRecord.event_id != 385){
              console.log("Properties Count " + avlRecord.properties_count)
              for (const [key, element] of Object.entries(avlRecord.ioElements)) {
                 for (const [property, val] of Object.entries(element)) {
                    console.log(`IO Element ${key} ${property}: ${val}`);
                    if (property == "value"){
                       for (const [prop, v] of Object.entries(val)) {
                          console.log(`IO Element ${key} ${property} ${val} ${prop}: ${v}`);
                       }
                    }
                 }
                 //console.log(`IO Element ${key}: ${value}`);
              }
           }
        }
        
        
  
  
     }

}

ui_inst = new UI()

//var stdin = process.openStdin();



