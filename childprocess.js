const binutils = require('binutils64');
const net = require('net');
//const mongo = require('mongodb')
const mqtt = require('mqtt')
const uuid = require('uuid');
const moment = require('moment');
const { assert } = require('console');



// console.log("hello world")
// let amount = randomIntFromInterval(1000,5000)
// console.log(`sleeping for ${amount} ms...`)
// sleep(amount)
// console.log("goodbye world")

const AVL_HEX = "000000000000002e8e01000001810116afe9004827f4c408c8bd7900000000000000018100010000000000000000000101810001110100001f43"
const AVL_buffer = Buffer.from(AVL_HEX, "hex")

var client = new net.Socket();

client.on('data', (message) => {     
    console.log("Received from server: ", message, "; size: ", message.length)
});  
// Add a 'close' event handler for the client socket 
client.on('close', () => { 
    console.log('connection closed'); 
});  
client.on('error', (err) => { 
    console.error(err); 
}); 

function connect(){
    client.connect(49366, 'localhost', () => {
        console.log("Created a connection to tft-server")
    })
}

var IMEI = generateIMEI()
console.log("START OF CYCLE")
for(var cycle_count = 0; cycle_count<20; cycle_count++){
    
    sleepRandomAmount(10000,30000)
    connect()
    sendIMEI(IMEI)
    sendAvlAtAnInterval()
    client.end()
}

// sleep
// connect
// send AVL hex at an interval x for n times
// disconnect

// send AVL hex at an interval x for n times
function sendAvlAtAnInterval(){
    let n = randomIntFromInterval(10, 20)
    let x = randomIntFromInterval(60000, 65000)
    for(var count = 0; count < n; count++){
        client.write(AVL_buffer)
        sleep(x)
    }
}


function sendIMEI(IMEI){
    //let sizeInt = 15
    let size_hex = Buffer.from("000f", "hex");
    let imei_hex = Buffer.from(IMEI.toString(), 'utf-8')

    let encoded_message = Buffer.concat([size_hex, imei_hex])

    //console.log(sizeInt.toString(16))
    console.log("Connecting to server with IMEI: ", IMEI)
    //console.log("Payload: ", encoded_message.toString("hex"))
    client.write(encoded_message)
}

function sleepRandomAmount(x, y){
    let amount = randomIntFromInterval(x, y)
    sleep(amount)
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


