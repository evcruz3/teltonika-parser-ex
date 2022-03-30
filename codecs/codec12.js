'use strict';

const binutils = require('binutils64');
const Codec = require('./codec');

/**
 * Codec 12 decoding
 */
class Codec12 extends Codec {
  /**
   * Codec 12 construct
   *
   * @param reader
   * @param number_of_records
   */
  constructor(reader) {
    super(reader, 1);
    //this._gpsPrecision = 10000000;
  }

  /**
   * Parsing AVL record header
   */
  parseHeader() {
    //this.gprsObj = []

    //for (var i = 0; i < this.number_of_records; i++) {
    //  this.parseAvlRecords();
    //}
    this.gprsObj.type = this.toInt(this.reader.ReadBytes(8));
    this.gprsObj.size = this.reader.ReadInt32();

    if(this.gprsObj.type == 5){
        parseGprsResponse(this.gprsObj.size);
    }
    
  }

  /**
   * Parse GPRS Response
   */
  parseGprsResponse(size) {
    let response = '';

    for (var i = 0; i < size; i++) {
      response.concat(String.fromCharCode(this.reader.ReadInt16()));
    }

    this.gprsObj.response = response;
  }
}

module.exports = Codec12;