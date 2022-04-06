'use strict';

const binutils = require('binutils64');
const codec7 = require('./codecs/codec7');
const codec8 = require('./codecs/codec8');
const codec16 = require('./codecs/codec8');
const codec8ex = require('./codecs/codec8ex');
const codec12 = require('./codecs/codec12');
const assert = require('assert');
const { Console } = require('console');

class TeltonikaParser {
  constructor(buffer) {
    this._reader = new binutils.BinaryReader(buffer);
    this._avlObj = {};
    this._gprsObj = {};
    this._preamble = null;
    this.checkIsImei();
    if (!this.isImei) {
      this.parseHeader();
      this.decodeData();
      this.parseFooter();
    }
  }

  checkIsImei() {
    let imeiLength = this._toInt(this._reader.ReadBytes(2)); 
    if (imeiLength > 0) {
      this.isImei = true;
      this.imei = this._reader.ReadBytes(imeiLength).toString();
    } else {
      let tmp = this._toInt(this._reader.ReadBytes(2));
      this._preamble = Buffer.from(imeiLength.toString(16).padStart(2,0) + tmp.toString(16).padStart(2,0), "hex")
      if("0000" != this._preamble.toString("hex")){
        //console.log("WARNING: Parsed preamble is not 0x0000; " + this._preamble.toString("hex"));
        this._preamble = Buffer.from("0x0000", "hex")
      } 
    }
  }

  /**
   * Parsing AVL record header
   */
  parseHeader() {
    this._headerObj = {
      data_length: this._reader.ReadInt32(),
      codec_id: this._toInt(this._reader.ReadBytes(1)),
      number_of_data: this._toInt(this._reader.ReadBytes(1)),
    };

    this._codecReader = this._reader;

    this.isGprs = true ? this._headerObj.codec_id == 12 : false;

    switch (this._headerObj.codec_id) {
      case 7:
        this._codec = new codec7(
          this._codecReader,
          this._headerObj.number_of_data
        );
        break;
      case 8:
        this._codec = new codec8(
          this._codecReader,
          this._headerObj.number_of_data
        );
        break;
      case 12:
        this._codec = new codec12(
          this._codecReader
        );
        break;
      case 16:
        this._codec = new codec16(
          this._codecReader,
          this._headerObj.number_of_data
        );
        break;
      case 142:
        this._codec = new codec8ex(
          this._codecReader,
          this._headerObj.number_of_data
        );
        break;
    }
  }

  decodeData() {
    if (this._codec) {
      this._codec.process();

      if(!this.isGprs){
        let intAvl = this._codec.getAvl();
        if(intAvl){
          intAvl.zero = this._preamble;
          intAvl.data_length = this._headerObj.data_length;
          intAvl.codec_id = this._headerObj.codec_id;
          intAvl.number_of_data = this._headerObj.number_of_data;
          this._avlObj = intAvl;
        }
      }
      else{
        let intGprs = this._codec.getGprs();
        if(intGprs){
          intGprs.preamble = this._preamble;
          intGprs.data_size = this._headerObj.data_length;
          intGprs.codec_id = this._headerObj.codec_id;
          this._gprsObj = intGprs;
        }
      }
    }
  }

  parseFooter() {
    this._avlObj.number_of_data2 = this._toInt(this._reader.ReadBytes(1));
    this._avlObj.CRC = {
      0: this._toInt(this._reader.ReadBytes(1)),
      1: this._toInt(this._reader.ReadBytes(1)),
      2: this._toInt(this._reader.ReadBytes(1)),
      3: this._toInt(this._reader.ReadBytes(1)),
    };
  }

  /**
   * Convert bytes to int
   *
   * @param bytes
   * @returns {number}
   * @private
   */
  _toInt(bytes) {
    return parseInt(bytes.toString('hex'), 16);
  }

  getHeader(){
    return this._headerObj;
  }

  getAvl() {
    return this._avlObj;
  }

  getGprs(){
    return this._gprsObj;
  }
}

module.exports = TeltonikaParser;
