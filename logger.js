const Parser = require('./utilities/teltonika-parser');
const binutils = require('binutils64');
const net = require('net');
const Devices = require('./device/devices')
const GprsCommandPacker = require("./utilities/gprsCommandPacker")
const fs = require('fs')
const consoleFormatter = require("./utilities/consoleFormatter")
//const mongo = require('mongodb')
const mqtt = require('mqtt')
const uuid = require('uuid');
const moment = require('moment')

const Pbf = require('pbf');
const compile = require('pbf/compile');
const schema = require('protocol-buffers-schema');
const { assert } = require('console');
const proto = schema.parse(fs.readFileSync('tftserver.proto'));
const SystemMessage = compile(proto).SystemMessage;

const devlist_path = ('./device/devlist.json')
const devlist_json = require(devlist_path)

console = consoleFormatter(console)
Date.prototype.toJSON = function(){ return moment(this).format(); }

// class Logger{
    /*
     * COMMUNICATION PORTS
     * 
     * 
     * 49364 - logger <-> ui
     * 49365 - logger <-> mqtt_ware
     * 49366 - logger <-> tft-devices
     * 
     */
    // constructor (){
const PREFIX = "LOGGER"

function log (message){
    console.log(`[${PREFIX}] `, message);
}

var devices = new Devices()
//var inst = this
//var requests = {}
var dev_names = []


/*-----------------------
 --------- MQTT ---------
 ------------------------*/
const host = 'localhost'
const port = '1883'
const clientId = uuid.v1

const connectUrl = `mqtt://${host}:${port}`
const mqtt_client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'tft100',
    password: 'S8Y5mvDdGGWjxj5h',
    reconnectPeriod: 1000,
})

mqtt_client.on('connect', () => {
    log('Connected to MQTT')
})

/*
 * Load Devices from JSON file
 */
for (const [key, device] of Object.entries(devlist_json['devices'])) {
    devices.addDevice(device.imei, null, device.id)
    if("name" in device){
        dev_names.push(device.name)
        devices.devices[device.id].name = device.name
    }
    log("Device " + device.id + " loaded")
}

        
/*-----------------------
 ------ TFT SERVER ------
 ------------------------*/
const tft_server = net.createServer((c) => {
    c.on('end', () => {
        let id = devices.getDeviceBySocket(c).id
        log("Device " + id + " disconnected");
        devices.setDeviceReady(id, false);
        //devices.removeDeviceBySocket(c);
        //clients
    });
        
    c.on('data', (data) => {
        
        let buffer = data;
        let parser = new Parser(buffer);
        if(parser.isImei){
            let id = -1
            let dev = devices.getDeviceByImei(parser.imei)
            if (dev){
                dev.updateSocket(c)
                id = dev.id
                devices[id] = dev
                log("Device " + id + " reconnected")

            }
            else{
                id = devices.addDevice(parser.imei, c)
                log("New device added; ID: " + id + "; IMEI: " + parser.imei)   
                devlist_json['devices'].push({"id":id,"imei":parser.imei,"name":""});
                let stream = fs.createWriteStream(devlist_path, {flags:'w'});
                stream.write(JSON.stringify(devlist_json))
            }
            
            c.write(Buffer.alloc(1,1));
            
            devices.setDeviceReady(id)
            log("Device " + id + " is online")       
        }
        else { // Parse Data
            let device = devices.getDeviceBySocket(c)
            let id = device.id
            let header = parser.getHeader();

            if(header.codec_id == 12){
                log("Received GPRS message from device  " + id)
                let gprs = parser.getGprs()
                
                mqtt_publishGprs(id, gprs)
                // log("Type: " + gprs.type + "; Size: " + gprs.size + "\nMessage: " + gprs.response)
                // send_to_ui(inst, id, gprs)
            }
            else if(header.codec_id == 142){
                // 1: Parse AVL Data
                let avl = parser.getAvl() 

                // 2. Write Response to TFT Device
                let writer = new binutils.BinaryWriter();
                writer.WriteInt32(avl.number_of_data);
                let response = writer.ByteBuffer;
                c.write(response);
                
                // 3: Warn if parsed preamble is not zero
                if("0000" != avl.zero)
                    log("WARNING: Parsed preamble is not 0x0000; " + avl.zero);
                else
                    log("Received AVL data from device " + id);

                // 4. Publish AVL records to MQTT Broker
                let message = JSON.stringify(avl.records)
                mqtt_publishAvlRecords(id, message)
                
                // 5. Check for pending message for the TFT device
                // let request = requests[id]
                // if(request !== undefined){
                //     log("Pending request for " + id + ": ")
                //     log(request)
                //     let now = new Date()
                //     let diff = (now.getTime() - request.timestamp.getTime())/1000

                //     log(`Pending request life: ${diff}`)
                //     if (diff <= 30){
                //         device.sendCommand(request.buffer)
                //         log("Pending message sent to dev " + id)
                //     }
                    
                // }

                // 6. Log raw data to local folder
                let now = new Date();
                let tmp_filename = `dev${id}-${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.txt`
                let tmp_path = `devlogs/${id}/`

                if (!fs.existsSync(tmp_path)) fs.mkdirSync(tmp_path, { recursive: true });

                let stream = fs.createWriteStream(`${tmp_path}${tmp_filename}`, {flags:'a'});
                stream.write(data.toString("hex")+"\n");
            }
                
        }
    });
});
        
function mqtt_publishAvlRecords(id, message){
    mqtt_client.publish(`/tft100-server/${id}/_avlrecords`, message, { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }
    })
}    

function mqtt_publishGprs(id, gprs){
    mqtt_client.publish(`/tft100-server/${id}/_gprs`, JSON.stringify(gprs), { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }
    })
}

tft_server.listen(49366, () => {
    log("Teltonika Server started");
}); 


// Create port to listen to system commands
//clients = []
var client = null
let commandReceiver = net.createServer((c) => {
    c.on("end", () => {
        log("ui disconnected")
    });

    c.on('data', (message) => {
        
        try {
            let pbf = new Pbf(message);
            let data = SystemMessage.read(pbf)

            log(data)
            
            let deviceId = data.deviceId
            // let messageType = data.type
            // let messageCode = data.code 
            let command = data.command
            let parameters = data.parameters

            
            client = c

            if(deviceId == "_sys" || deviceId == "-1")
                processSystemCommand(command, parameters, c)
            else
                processDeviceCommand(deviceId, command, parameters, c)
        } catch (error) {
            log(error)
        }
        
            
    }); 

})

function sendMessage(c, data){
    let pbf = new Pbf();
    let obj = SystemMessage.read(pbf);
    SystemMessage.write(obj, pbf);
    // SystemMessage.write(data, pbf);
    pbf.writeStringField(1, `${data.deviceId}`)
    pbf.writeVarintField(2, data.messageType.value)
    pbf.writeVarintField(3, data.messageCode.value)
    pbf.writeStringField(4, `${data.command}`)
    pbf.writeStringField(5, `${data.parameters}`)
    data.additional_info ? pbf.writeStringField(6, `${data.additional_info}`):'';

    
    let buffer = pbf.finish();
    // console.log("Sending: ", data)
    // console.log("Sending: ", SystemMessage.read(new Pbf(buffer)))
    c.write(buffer)
}

function processSystemCommand(command, parameterString, c){
    if (command == "listDevices"){
        devices.printDevices(c)
        //clients.pop()
    }
    else if(command == "setDeviceName"){
        let parameters = parameterString.split(" ")
        
        if (parameters.length < 2) {
            let data_buffer = {deviceId : "_sys", 
                messageType : SystemMessage.MessageType.RESPONSE, 
                messageCode : SystemMessage.MessageCode.INVALID_FORMAT,
                command : command,
                parameters : parameterString}
            sendMessage(c, data_buffer)
        }
        else{

            let tmp = parameters[0]
            let dev_name = parameters[1]

            

            if(dev_name in dev_names){

                let data_buffer = {deviceId : "_sys", 
                    messageType : SystemMessage.MessageType.RESPONSE, 
                    messageCode : SystemMessage.MessageCode.OTHER,
                    command : command,
                    parameters : parameterString,
                    additional_info : `${dev_name} already in use, please use another name`
                }
                sendMessage(c, data_buffer)
                //c.write(`${id}:\n`+dev_name + "already in use, please use another name")
            }
            else{

                let dev = isNaN(tmp) ? devices.getDeviceByName(tmp) : devices.getDeviceByID(tmp)

                if(dev){
                    let id = dev.id
                    devlist_json['devices'][id].name = dev_name
                    let stream = fs.createWriteStream(devlist_path, {flags:'w'});
                    stream.write(JSON.stringify(devlist_json))
                    dev.setName(dev_name)
                    let data_buffer = {deviceId : "_sys", 
                        messageType : SystemMessage.MessageType.RESPONSE, 
                        messageCode : SystemMessage.MessageCode.OK,
                        command : command,
                        parameters : parameterString
                    }
                    sendMessage(c, data_buffer)
                }
                else{
                    let data_buffer = {deviceId : "_sys", 
                        messageType : SystemMessage.MessageType.RESPONSE, 
                        messageCode : SystemMessage.MessageCode.INVALID_DEVICE_ID,
                        command : command,
                        parameters : parameterString
                    }
                    //console.log("Sending: ", data_buffer)
                    sendMessage(c, data_buffer)
                }
                
                
            }
        }
        //clients.pop()
    }
}

commandReceiver.listen(49365, () => {
    log("Waiting for command from ui...")
})

function processDeviceCommand(deviceId, command, parameterString, c){
    let message = command + " " + parameterString
    let gprsCommandPacker = new GprsCommandPacker(message)
    let outBuffer = gprsCommandPacker.getGprsMessageBuffer()

    let tmp = deviceId
    //console.log(deviceId,command, parameterString )
    let dev = isNaN(tmp) ? devices.getDeviceByName(tmp) : devices.getDeviceByID(parseInt(tmp))

    //let id = dev.id

    if (dev !== undefined && dev !== null){
        if(dev.isReady){
            // c.write("-1:\n'" + message + "' sent to device " + tmp);
            dev.sendCommand(outBuffer)
            let data_buffer = {deviceId : deviceId, 
                    messageType : SystemMessage.MessageType.RESPONSE, 
                    messageCode : SystemMessage.MessageCode.OK,
                    command : command,
                    parameters : parameterString
                }
            sendMessage(c, data_buffer)
        }
        else{
            let data_buffer = {deviceId : deviceId, 
                    messageType : SystemMessage.MessageType.RESPONSE, 
                    messageCode : SystemMessage.MessageCode.DEVICE_OFFLINE,
                    command : command,
                    parameters : parameterString
                }
            sendMessage(c, data_buffer)
            //c.write(dev.id + ":\nDevice " + tmp + " is currently offline, will send once the device goes online")
            //let timestamp = new Date()

            //requests[dev.id] = {"timestamp" : timestamp, "buffer" : outBuffer}
            //clients.pop()
        }
        
    }
    else{
        let data_buffer = {deviceId : deviceId, 
            messageType : SystemMessage.MessageType.RESPONSE, 
            messageCode : SystemMessage.MessageCode.INVALID_DEVICE_ID,
            command : command,
            parameters : parameterString
        }
        sendMessage(c, data_buffer)
        // c.write("-1:\nDevice " + tmp + " not found")
        //clients.pop()
    }
}

// }