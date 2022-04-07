'use strict';

const binutils = require('binutils64');
const assert = require('assert');

class GprsPacker {
  constructor(message) {
    //this._writer = new binutils.BinaryWriter();

    this._command = Buffer.from(message);
    this._prefix = Buffer.from('00000000', "hex"); // JavaScript allows hex numbers.
    this._dataSize = Buffer.from((Buffer.byteLength(this._command) + 8).toString(16).padStart(8, '0'), "hex");
    this._codecID = Buffer.from('0C', "hex");
    this._cq1 = Buffer.from('01', "hex");
    this._commandType = Buffer.from('05', "hex");
    this._commandSize = Buffer.from((Buffer.byteLength(this._command)).toString(16).padStart(8, '0'), "hex");
    this._cq2 = Buffer.from('01', "hex");
    // compute the required buffer length
    //var bufferSize = 4 + dataSize;
    //var buffer = Buffer.from()
    // prefix, dataSize, codecID, cq1, commandType, commandSize, command, cq2, crc
    let encoded_message = Buffer.concat([this._codecID, this._cq1, this._commandType, this._commandSize, this._command, this._cq2])
    //console.log(encoded_message.toString("hex"))

    this._crc = Buffer.from(crc16ibm(encoded_message).toString(16).padStart(8, '0'), "hex");
    //console.log(crc.toString("hex"))

    this._gprsMessage = Buffer.concat([this._prefix, this._dataSize, encoded_message, this._crc])
  }

  getCommandString(){
      return this._command.toString("hex")
  }

  getPrefixString(){
      return this._prefix.toString("hex")
  }

  getDataSizeInt(){
      return parseInt(this._dataSize.toString("hex"), 16)
  }

  getCommandTypeInt(){
      return parseInt(this._commandType.toString("hex"), 16)
  }

  getCommandSizeInt(){
      return parseInt(this._commandSize.toString("hex"), 16)
  }

  getCrcString(){
      return this._crc.toString("hex")
  }

  getGprsMessageString(){
      return this._gprsMessage.toString("hex")
  }

  getGprsMessageBuffer(){
      return this._gprsMessage
  }
}

module.exports = GprsPacker;
