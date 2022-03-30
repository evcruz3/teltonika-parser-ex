//const { assert } = require('chai');

//const prompt = require('prompt-sync')({sigint: true});
crc16ibm = require('./crc16ibm')

const user_prompt = "getinfo"
console.log("message");

//var data = "ABC";
var command = Buffer.from(user_prompt);
var prefix = Buffer.from('00000000', "hex"); // JavaScript allows hex numbers.
var dataSize = Buffer.from((Buffer.byteLength(command) + 8).toString(16).padStart(8, '0'), "hex");
var codecID = Buffer.from('0C', "hex");
var cq1 = Buffer.from('01', "hex");
var commandType = Buffer.from('05', "hex");
var commandSize = Buffer.from((Buffer.byteLength(command)).toString(16).padStart(8, '0'), "hex");
//console.log("command Size: " + commandSize)

var cq2 = Buffer.from('01', "hex");
// compute the required buffer length
//var bufferSize = 4 + dataSize;
//var buffer = Buffer.from()
// prefix, dataSize, codecID, cq1, commandType, commandSize, command, cq2, crc
var encoded_message = Buffer.concat([codecID, cq1, commandType, commandSize, command, cq2])
console.log(encoded_message.toString("hex"))

var crc = Buffer.from(crc16ibm(encoded_message).toString(16).padStart(8, '0'), "hex");
console.log(crc.toString("hex"))

var output = Buffer.concat([prefix, dataSize, encoded_message, crc])
console.log(output.toString("hex"))
console.log("000000000000000F0C010500000007676574696E666F0100004312")

//console.log(encoded_message);

//module.exports = send-command-ui