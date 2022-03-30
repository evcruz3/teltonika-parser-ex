'use strict';

const binutils = require('binutils64');

/**
 * Base codec class
 */
class Codec {
  /**
   * Codec constructor
   *
   * @param reader
   * @param number_of_records
   */
  constructor(reader, number_of_records) {
    this.reader = reader;
    this.number_of_records = number_of_records;
    this.avlObj = {};
    this.gprsObj = {};
  }

  /**
   * Run parse processAVL
   */
  process() {
    this.parseHeader();
  }

  /**
   * Convert bytes to int
   *
   * @param bytes
   * @returns {number}
   * @private
   */
  toInt(bytes) {
    return parseInt(bytes.toString('hex'), 16);
  }

  /**
   * Get AVL object
   *
   * @returns {{}}
   */
  getAvl() {
    return this.avlObj;
  }

  getGprs(){
    return this.gprsObj;
  }
}

module.exports = Codec;
