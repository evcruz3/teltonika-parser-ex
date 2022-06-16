const binutils = require('binutils64');
const net = require('net');
const GprsResponsePacker = require("./utilities/gprsResponsePacker")
//const mongo = require('mongodb')


// console.log("hello world")
// let amount = randomIntFromInterval(1000,5000)
// console.log(`sleeping for ${amount} ms...`)
// sleep(amount)
// console.log("goodbye world")

const AVL_HEX = "000000000000002e8e01000001810116afe9004827f4c408c8bd7900000000000000018100010000000000000000000101810001110100001f43"
const AVL_buffer = Buffer.from(AVL_HEX, "hex")

var client = null;
var digOut1 = 0;
var digOut2 = 0;


async function connect(){
    client = new net.Socket();

    client.on('data', (message) => {     
        //console.log("Received from server: ", message, "; size: ", message.length)
        if(message.length > 5){
            let commandString = getGPRSCommand(message)
            
            let [command, _parameters, ...others] = commandString.split(" ")
            console.log(`Received GPRS Command: ${command}; Parameters: ${_parameters}`)
            let _param1 = _parameters.substring(0,1)
            let _param2 = _parameters.substring(1,2)
            let response1 = ""
            let response2 = ""

            if (command == "setdigout"){
                if(!(isNaN(_param1))){
                    let intParam1 = parseInt(_param1)
                    if(digOut1 != intParam1){
                        digOut1 = intParam1
                        response1 = `DOUT1:${digOut1} Timeout:INFINITY`
                    }
                    else{
                        response1 = `DOUT1:Already set to ${digOut1}`
                    }
                    
                }
                else {
                    response1 = `DOUT1:IGNORED`
                }

                if(!(isNaN(_param2))){
                    let intParam2 = parseInt(_param2)
                    if(digOut2 != intParam2){
                        digOut2 = intParam2
                        response2 = `DOUT2:${digOut2} Timeout:INFINITY`
                    }
                    else{
                        response2 = `DOUT2:Already set to ${digOut2}`
                    }
                    
                }
                else {
                    response2 = `DOUT2:IGNORED`
                }

                let response = `${response1} ${response2}`

                let gprsResponsePacker = new GprsResponsePacker(response)
                let outBuffer = gprsResponsePacker.getGprsMessageBuffer()

                client.write(outBuffer)
                console.log(`Sent a response: ${response}`)
            }

        }
    });  
    // Add a 'close' event handler for the client socket 
    client.on('close', () => { 
        console.log('connection closed'); 
    });  
    client.on('error', (err) => { 
        console.error(err); 
    }); 

    client.connect(49366, 'localhost', () => {
        console.log("Created a connection to tft-server")
    })
}

var IMEI = generateIMEI()
console.log("START OF CYCLE")
run()
async function run() {
    for(var cycle_count = 0; cycle_count<20; cycle_count++){
        await sleepRandomAmount(10000,30000)
        console.log("Establishing connection...")
        await connect()
        console.log("Sending IMEI...")
        await sendIMEI(IMEI)
        await sendAvlAtAnInterval()
        console.log("Ending connection...")
        client.destroy()
    }
}


// sleep
// connect
// send AVL hex at an interval x for n times
// disconnect

function getGPRSCommand(buffer){
    let parser = new binutils.BinaryReader(buffer);

    let preamble = _toInt(parser.ReadBytes(4));
    let data_size = _toInt(parser.ReadBytes(4));
    let codec_id = _toInt(parser.ReadBytes(1));
    let command_quantity_1 =  _toInt(parser.ReadBytes(1));
    let message_type = _toInt(parser.ReadBytes(1));
    let message_size = _toInt(parser.ReadBytes(4));
    let imei = null; // for codec 14
    let message = parser.ReadBytes(message_size).toString();
    let timestamp = null // for codec 13
    let command_quantity_2 = _toInt(parser.ReadBytes(1));
    let crc = parser.ReadBytes(4).toString("hex");

    return message;
}

function _toInt(bytes) {
    return parseInt(bytes.toString('hex'), 16);
}

// send AVL hex at an interval x for n times
async function sendAvlAtAnInterval(){
    let n = randomIntFromInterval(5, 10)
    let x = randomIntFromInterval(55000, 65000)
    for(var count = 0; count < n; count++){
        console.log("sending AVL Data...")
        client.write(AVL_buffer)
        await sleep(x)
    }
}


async function sendIMEI(IMEI){
    //let sizeInt = 15
    let size_hex = Buffer.from("000f", "hex");
    let imei_hex = Buffer.from(IMEI.toString(), 'utf-8')

    let encoded_message = Buffer.concat([size_hex, imei_hex])

    //console.log(sizeInt.toString(16))
    console.log("Connecting to server with IMEI: ", IMEI)
    //console.log("Payload: ", encoded_message.toString("hex"))
    client.write(encoded_message)
}

async function sleepRandomAmount(x, y){
    let amount = randomIntFromInterval(x, y)
    await sleep(amount)
}

async function sleep(amount){
    await new Promise(resolve => setTimeout(resolve, amount));
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateIMEI(){
    return randomIntFromInterval(359633109248373,359633109999999)
}


