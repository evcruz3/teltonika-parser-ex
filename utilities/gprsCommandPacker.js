'use strict';

const binutils = require('binutils64');
const crc16ibm = require('./crc16ibm');
const Gprs = require('./gprs')

class GprsCommandPacker {
  constructor(message) {
    //this._writer = new binutils.BinaryWriter();

    this._messageString = message;
    this._command = Buffer.from(message);
    this._preamble = Buffer.from('00000000', "hex"); // JavaScript allows hex numbers.
    this._dataSize = Buffer.from((Buffer.byteLength(this._command) + 8).toString(16).padStart(8, '0'), "hex");
    this._codecID = Buffer.from('0C', "hex");
    this._cq1 = Buffer.from('01', "hex");
    this._commandType = Buffer.from('05', "hex");
    this._commandSize = Buffer.from((Buffer.byteLength(this._command)).toString(16).padStart(8, '0'), "hex");
    this._cq2 = Buffer.from('01', "hex");
    // compute the required buffer length
    //var bufferSize = 4 + dataSize;
    //var buffer = Buffer.from()
    // preamble, dataSize, codecID, cq1, commandType, commandSize, command, cq2, crc

    
    let encoded_message = Buffer.concat([this._codecID, this._cq1, this._commandType, this._commandSize, this._command, this._cq2])
    //console.log(encoded_message.toString("hex"))

    this._crc = Buffer.from(crc16ibm(encoded_message).toString(16).padStart(8, '0'), "hex");
    
    //console.log(crc.toString("hex"))

    this._gprsBuffer = Buffer.concat([this._preamble, this._dataSize, encoded_message, this._crc])
    this._gprsObject = new Gprs()
    this._writeToGprsObj()
  }

  _writeToGprsObj(){
    this._gprsObject.preamble = parseInt(this._preamble.toString("hex"), 16);
    this._gprsObject.data_size = parseInt(this._dataSize.toString("hex"), 16);
    this._gprsObject.codec_id = parseInt(this._codecID.toString("hex"), 16);
    this._gprsObject.command_quantity_1 =  parseInt(this._cq1.toString("hex"), 16);
    this._gprsObject.message_type = this._getMessageType(this._codecID);
    this._gprsObject.message_size = parseInt(this._commandSize.toString("hex"), 16);
    this._gprsObject.imei = null; // for codec 14
    this._gprsObject.message = this._messageString;
    this._gprsObject.timestamp = null // for codec 13
    this._gprsObject.command_quantity_2 = parseInt(this._cq2.toString("hex"), 16);
    this._gprsObject.crc = this._crc.toString("hex");

  }

  _getMessageType(codec){
    let val = parseInt(this._commandType.toString("hex"), 16);
    let messageType = ""

    if(codec == 12){
        messageType = "COMMAND" ? val == 5 : "RESPONSE" ? val == 6 : "UNKNOWN";
    }
    else{ // TODO: Support codec 13 and 14 for GPRS packer
        messageType = "UNKNOWN"
    }

    return messageType;
  }

  getGprsObject(){
      return this._gprsObject;
  }

  getGprsMessageBuffer(){
      return this._gprsBuffer;
  }
}

module.exports = GprsCommandPacker;
