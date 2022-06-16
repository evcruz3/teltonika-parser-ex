const binutils = require('binutils64');
const net = require('net');
//const mongo = require('mongodb')
const mqtt = require('mqtt')
const uuid = require('uuid');
const moment = require('moment');



// console.log("hello world")
// let amount = randomIntFromInterval(1000,5000)
// console.log(`sleeping for ${amount} ms...`)
// sleep(amount)
// console.log("goodbye world")

let amount = randomIntFromInterval(1000,20000)
sleep(amount)

var client = new net.Socket();

client.connect(49366, 'localhost', () => {
    console.log("Created a connection to tft-server")
})

client.on('data', (message) => {     
    console.log("Received from server: ", message, "; size: ", message.length)
    client.end()
    
});  
// Add a 'close' event handler for the client socket 
client.on('close', () => { 
    console.log('connection closed'); 
});  
client.on('error', (err) => { 
    console.error(err); 
}); 

let IMEI = generateIMEI()
sendIMEI(IMEI)



function sendIMEI(IMEI){
    let sizeInt = 15
    let size_hex = Buffer.from("000f", "hex");
    let imei_hex = Buffer.from(IMEI.toString(), 'utf-8')

    let encoded_message = Buffer.concat([size_hex, imei_hex])

    console.log(sizeInt.toString(16))
    console.log("Connecting to server with IMEI: ", IMEI, "; size: ", parseInt(size_hex.toString("hex"), 16))
    console.log("Payload: ", encoded_message.toString("hex"))
    client.write(encoded_message)
}

async function sleep(time){
    await new Promise(resolve => setTimeout(resolve, 5000));
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateIMEI(){
    return randomIntFromInterval(359633109248373,359633109999999)
}


