const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const ByteBuffer = require("bytebuffer");
const Devices = require('./device/devices')
const prompt = require('prompt-sync')
const crc16ibm = require('./utilities/crc16ibm')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")
const fs = require('fs')
const myRL = require("serverline");
const consoleFormatter = require("./utilities/consoleFormatter")

var Pbf = require('pbf');
var compile = require('pbf/compile');
var schema = require('protocol-buffers-schema');
var proto = schema.parse(fs.readFileSync('tftserver.proto'));
var SystemMessage = compile(proto).SystemMessage;

console = consoleFormatter(console)

class UI{
    constructor (){
        //this.devices = new Devices()
        var _inst = this
        const PREFIX = "UI"

        function log (message){
            console.log(`[${PREFIX}] `, message);
        }

        process.stdout.write("\x1Bc")
        log(Array(process.stdout.rows + 1).join('\n'));

        myRL.init()
        myRL.setCompletion(['sendCommand', 'listDevices', 'setDeviceName']);
        myRL.on('line', function(d) {
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


            if (ui_command == "sendCommand"){
                //_inst.client.write(d)
                var pbf = new Pbf();
                var obj = SystemMessage.read(pbf);
                //let command = others[0]
                let command = others.splice(0,1)
                let param = others.join(" ")

                SystemMessage.write(obj, pbf);
                pbf.writeStringField(1, `${id}`)
                pbf.writeStringField(4, `${command}`)
                pbf.writeStringField(5, `${param}`)
                var buffer = pbf.finish();

                _inst.client.write(buffer)
                
            }
            else if (ui_command == "displayLog"){
                if(isNaN(tmp)){
                    var id = Object.keys(devices).find(key => devices[key] === tmp);
                } 
                else{
                    var id = tmp
                }

                if(id in devices){
                    if(others[0]){
                        _inst._displayLog(id, _inst, others[0])
                    }
                    else{
                        _inst._displayLog(id, _inst)
                    }
                    
                }
                else{
                    log("Device not found / specified")
                }
            }
            else{
                var pbf = new Pbf();
                var obj = SystemMessage.read(pbf);
                //let command = others[0]
                //let command = others.splice(0,1)
                let param = tmp + " " + others.join(" ")

                SystemMessage.write(obj, pbf);
                pbf.writeStringField(1, `_sys`)
                pbf.writeStringField(4, `${ui_command}`)
                pbf.writeStringField(5, `${param}`)
                var buffer = pbf.finish();

                _inst.client.write(buffer)
            }
            // else if (ui_command == "getGpsAll"){
            //     _inst.client.write(d)
            // }
            
            
        });

        // Port 49365 for sending ui commands to logger module
        this.client = new net.Socket();

        this.client.connect(49365, 'localhost', () => {
            log("Created a connection to ui node")
        })

        this.client.on('data', (message) => {     
            //log(`Client received: ${data}`); 
            try {
                let pbf = new Pbf(message);
                let data = SystemMessage.read(pbf)

                log(data)
            } catch (error) {
                log(message)
                log(error)
            }
            
        });  
        // Add a 'close' event handler for the client socket 
        this.client.on('close', () => { 
            log('logger closed'); 
        });  
        this.client.on('error', (err) => { 
            console.error(err); 
        }); 

        

    }

    _displayLog(id, _inst, n=-1){
        //let devices = new Devices()
        //devices.addDevice(null, null, id)
        let now = new Date();
        let dir_path = `devlogs/${id}/`
        let filestring = `dev${id}-${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.txt`
        let filename = dir_path + filestring

        if(n && n>0){
            let lineReader = require('read-last-lines')
            // lineReader.read(filename, n).then((lines) => lines.forEach(element => {
            //     this._parseLine(element);
            // }))
            let lines = lineReader.read(filename, n).then((lines) => {
                let data = lines.split(/\r?\n/)
                for (const [_, val] of Object.entries(data)) {
                    _inst._parseLine(val, _inst);
                }
            }, reason => {
                console.error(reason)
            })
        }
        else{
            let lineReader = require('readline').createInterface({
                input: require('fs').createReadStream(filename)
              });
              
              lineReader.on('line', function(data) {
                _inst._parseLine(data, _inst);
              } );
        }
    }

    _parseLine (data, _inst) {
        let buffer = Buffer.from(data, "hex");
        let parser = new Parser(buffer);
        
        let header = parser.getHeader();
        
        if(header.codec_id == 142){
            let avl = parser.getAvl()

            _inst.log("AVL DATA")
            for (var i = 0; i < avl.number_of_data; i++) {
                _inst._printAvlRecord(avl.records, i);
            }
            _inst.log()
        }
    }

    _printAvlRecord(avlRecords, index){
        let avlRecord = avlRecords[index]
  
        //_inst.log("KEYS: " + Object.keys(avlRecord))
        _inst.log("Timestamp: " + avlRecord.timestamp)
        _inst.log("Priority: " + avlRecord.priority)
        for (const [key, value] of Object.entries(avlRecord.gps)) {
            _inst.log(`GPS ${key}: ${value}`);
            if (key == "valueHuman" && value){
                
                for (const [property, val] of Object.entries(value)) {
                    _inst.log(`GPS ${key} ${value} ${property} : ${val}`);
                }
            }
        }
        //_inst.log("GPS: " + avlRecord.gps)
        _inst.log("Event ID: " + avlRecord.event_id)
        _inst.log("Properties Count " + avlRecord.properties_count)
        for (const [key, element] of Object.entries(avlRecord.ioElements)) {
            for (const [property, val] of Object.entries(element)) {
                if (val){
                    _inst.log(`IO Element ${key} ${property}: ${val}`);
                }
                if (property == "value"){
                    for (const [prop, v] of Object.entries(val)) {
                        _inst.log(`IO Element ${key} ${property} ${val} ${prop}: ${v}`);
                    }
                }
            }
            //_inst.log(`IO Element ${key}: ${value}`);
        }
    }

}

ui_inst = new UI()

//var stdin = process.openStdin();



