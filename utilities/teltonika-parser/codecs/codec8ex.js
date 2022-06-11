'use strict';

const binutils = require('binutils64');
const Codec = require('./codec');

/**
 * Codec 8 decoding
 */
class Codec8e extends Codec {
  /**
   * Trip event id's
   *
   * @returns {number}
   * @constructor
   */
  static get TRIP_EVENT_ID() {
    return 250;
  }

  /**
   * Trip start flag
   *
   * @returns {number}
   * @constructor
   */
  static get TRIP_EVENT_START() {
    return 1;
  }

  /**
   * Trip end flag
   *
   * @returns {number}
   * @constructor
   */
  static get TRIP_EVENT_END() {
    return 0;
  }

  /**
   * Odometer property id
   *
   * @returns {number}
   * @constructor
   */
  static get ODOMETER_PROPERTY_ID() {
    return 16;
  }

  /**
   * Codec 8 construct
   *
   * @param reader
   * @param number_of_records
   */
  constructor(reader, number_of_records) {
    super(reader, number_of_records);
    this._gpsPrecision = 10000000;
  }

  /**
   * Parsing AVL record header
   */
  parseHeader() {
    this.avlObj.records = [];

    for (var i = 0; i < this.number_of_records; i++) {
      this.parseAvlRecords();
    }
  }

  /**
   * Parse single AVL record
   */
  parseAvlRecords() {
    let avlRecord = {
      timestamp: new Date(this.toInt(this.reader.ReadBytes(8))),
      priority: this.toInt(this.reader.ReadBytes(1)),
      gps: {
        longitude: this.reader.ReadInt32(),
        latitude: this.reader.ReadInt32(),
        altitude: this.reader.ReadInt16(),
        angle: this.reader.ReadInt16(),
        satellites: this.reader.ReadInt8(),
        speed: this.reader.ReadInt16(),
      },
      event_id: this.toInt(this.reader.ReadBytes(2)),
      properties_count: this.toInt(this.reader.ReadBytes(2)),
      ioElements: [],
    };

    if ('0' == avlRecord.gps.longitude.toString(2).substr(0, 1)) {
      avlRecord.gps.longitude *= -1;
    }
    avlRecord.gps.longitude /= this._gpsPrecision;

    if ('0' == avlRecord.gps.latitude.toString(2).substr(0, 1)) {
      avlRecord.gps.latitude *= -1;
    }
    avlRecord.gps.latitude /= this._gpsPrecision;

    avlRecord.ioElements = this.parseIoElements();

    this.avlObj.records.push(avlRecord);
  }

  /**
   * Parse single IoElement records
   *
   * @returns {Array}
   */
  parseIoElements() {
    let ioElement = [];

    /**
     * Read 1 byte ioProperties
     */
    let ioCountInt8 = this.toInt(this.reader.ReadBytes(2));

    for (var i = 0; i < ioCountInt8; i++) {
      let property_id = this.toInt(this.reader.ReadBytes(2));
      let value = this.toInt(this.reader.ReadBytes(1));

      // let elToPush = {
      //     id        : property_id,
      //     value     : value
      // };
      // if(this.ioElements()[property_id]){
      //     elToPush.label = this.ioElements()[property_id].label;
      //     elToPush.dimension = this.ioElements()[property_id].dimension;
      //     if(this.ioElements()[property_id].values[value]){
      //         elToPush.valueHuman: this.ioElements()[property_id].values[value];
      //     }
      // }

      ioElement.push({
        id: property_id,
        value: value,
        label: this.ioElements()[property_id]
          ? this.ioElements()[property_id].label
          : '',
        dimension: this.ioElements()[property_id]
          ? this.ioElements()[property_id].dimension
          : '',
        valueHuman: this.ioElements()[property_id]
          ? this.ioElements()[property_id].values
            ? this.ioElements()[property_id].values[value]
            : ''
          : '',
      });
    }

    /**
     * Read 2 byte ioProperties
     */
    let ioCountInt16 = this.toInt(this.reader.ReadBytes(2));

    for (var i = 0; i < ioCountInt16; i++) {
      let property_id = this.toInt(this.reader.ReadBytes(2));
      let value = this.reader.ReadInt16();

      ioElement.push({
        id: property_id,
        value: value,
        label: this.ioElements()[property_id]
          ? this.ioElements()[property_id].label
          : '',
        dimension: this.ioElements()[property_id]
          ? this.ioElements()[property_id].dimension
          : '',
        valueHuman: this.ioElements()[property_id]
          ? this.ioElements()[property_id].values
            ? this.ioElements()[property_id].values[value]
            : ''
          : '',
      });
    }

    /**
     * Read 4 byte ioProperties
     */
    let ioCountInt32 = this.toInt(this.reader.ReadBytes(2));

    for (var i = 0; i < ioCountInt32; i++) {
      let property_id = this.toInt(this.reader.ReadBytes(2));
      let value = this.reader.ReadInt32();

      ioElement.push({
        id: property_id,
        value: value,
        label: this.ioElements()[property_id]
          ? this.ioElements()[property_id].label
          : '',
        dimension: this.ioElements()[property_id]
          ? this.ioElements()[property_id].dimension
          : '',
        valueHuman: this.ioElements()[property_id]
          ? this.ioElements()[property_id].values
            ? this.ioElements()[property_id].values[value]
            : ''
          : '',
      });
    }

    /**
     * Read 8 byte ioProperties
     */
    let ioCountInt64 = this.toInt(this.reader.ReadBytes(2));

    for (var i = 0; i < ioCountInt64; i++) {
      let property_id = this.toInt(this.reader.ReadBytes(2));
      let value = this.reader.ReadDouble();
      ioElement.push({
        id: property_id,
        value: value,
        label: this.ioElements()[property_id]
          ? this.ioElements()[property_id].label
          : '',
        dimension: this.ioElements()[property_id]
          ? this.ioElements()[property_id].dimension
          : '',
        valueHuman: this.ioElements()[property_id]
          ? this.ioElements()[property_id].values
            ? this.ioElements()[property_id].values[value]
            : ''
          : '',
      });
    }

    /**
     * Read n byte ioProperties
     */

    let ioCountIntX = this.toInt(this.reader.ReadBytes(2));

    for (var i = 0; i < ioCountIntX; i++) {
      let property_id = this.toInt(this.reader.ReadBytes(2));
      let ioValueLength = this.toInt(this.reader.ReadBytes(2));
      let value = null
      if (property_id == 385){
        console.log("iovaluelength: " + ioValueLength)
        if (ioValueLength == 19){
          value = {
            data: this.toInt(this.reader.ReadBytes(1)),
            beacon_flag: this.toInt(this.reader.ReadBytes(1)),
            beacon_id: this.toInt(this.reader.ReadBytes(16)),
            signal_strength: this.toInt(this.reader.ReadBytes(1))
          }
        }
        else if (ioValueLength == 23){
          value = {
            data: this.toInt(this.reader.ReadBytes(1)),
            beacon_flag: this.toInt(this.reader.ReadBytes(1)),
            beacon_id: this.toInt(this.reader.ReadBytes(20)),
            signal_strength: this.toInt(this.reader.ReadBytes(1))
          }
        }
        else{
          value = this.toString(this.reader.ReadBytes(ioValueLength));
        }
      }
      else{
        value = this.toString(this.reader.ReadBytes(ioValueLength));
      }
      

      ioElement.push({
        id: property_id,
        value: value,
        label: this.ioElements()[property_id]
          ? this.ioElements()[property_id].label
          : '',
        dimension: this.ioElements()[property_id]
          ? this.ioElements()[property_id].dimension
          : '',
        valueHuman: this.ioElements()[property_id]
          ? this.ioElements()[property_id].values
            ? this.ioElements()[property_id].values[value]
            : ''
          : '',
      });
    }

    return ioElement;
  }

  /**
   *  Codec 8 IoElements
   * @returns {{"1": {label: string, values: {"0": string, "1": string}}, "10": {label: string, values: {"0": string, "1": string}}, "11": {label: string}, "12": {label: string}, "13": {label: string, dimension: string}, "14": {label: string}, "15": {label: string}, "16": {label: string}, "17": {label: string}, "18": {label: string}, "19": {label: string}, "20": {label: string, dimension: string}, "21": {label: string, values: {"1": string, "2": string, "3": string, "4": string, "5": string}}, "22": {label: string, dimension: string}, "23": {label: string, dimension: string}, "24": {label: string, dimension: string}, "25": {label: string, dimension: string}, "26": {label: string, dimension: string}, "27": {label: string, dimension: string}, "28": {label: string, dimension: string}, "29": {label: string, dimension: string}, "30": {label: string}, "31": {label: string, dimension: string}, "32": {label: string, dimension: string}, "33": {label: string, dimension: string}, "34": {label: string, dimension: string}, "35": {label: string, dimension: string}, "36": {label: string, dimension: string}, "37": {label: string, dimension: string}, "38": {label: string, dimension: string}, "39": {label: string, dimension: string}, "40": {label: string, dimension: string}, "41": {label: string, dimension: string}, "42": {label: string, dimension: string}, "43": {label: string, dimension: string}, "44": {label: string, dimension: string}, "45": {label: string, dimension: string}, "46": {label: string, dimension: string}, "47": {label: string, dimension: string}, "48": {label: string, dimension: string}, "49": {label: string, dimension: string}, "50": {label: string, dimension: string}, "51": {label: string, dimension: string}, "52": {label: string, dimension: string}, "53": {label: string, dimension: string}, "54": {label: string, dimension: string}, "55": {label: string, dimension: string}, "56": {label: string, dimension: string}, "57": {label: string, dimension: string}, "58": {label: string, dimension: string}, "59": {label: string, dimension: string}, "60": {label: string, dimension: string}, "66": {label: string, dimension: string}, "67": {label: string, dimension: string}, "68": {label: string, dimension: string}, "69": {label: string, values: {"0": string, "1": string, "2": string, "3": string}}, "80": {label: string, values: {"0": string, "1": string, "2": string, "3": string, "4": string, "5": string}}, "86": {label: string, dimension: string}, "104": {label: string, dimension: string}, "106": {label: string, dimension: string}, "108": {label: string, dimension: string}, "181": {label: string}, "182": {label: string}, "199": {label: string}, "200": {label: string, values: {"0": string, "1": string, "2": string}}, "205": {label: string}, "206": {label: string}, "238": {label: string}, "239": {label: string, values: {"0": string, "1": string}}, "240": {label: string, values: {"0": string, "1": string}}, "241": {label: string}, "256": {label: string}}}
   */
  ioElements() {
    return {
      1: {
        label: "Digital Input 1",
        values: {
          0: "0",
          1: "1"
        }
      },
      2: {
        label: "Digital Input 2",
        values: {
          0: "0",
          1: "1"
        }
      },
      3: {
        label: "Digital Input 3",
        values: {
          0: "0",
          1: "1"
        }
      },
      6: {
        dimension: "mV",
        label: "Analog Input 2"
      },
      9: {
        dimension: "mV",
        label: "Analog Input 1"
      },
      11: {
        label: "ICCID1"
      },
      14: {
        label: "ICCID2"
      },
      15: {
        label: "Eco Score"
      },
      16: {
        dimension: "m",
        label: "Total Odometer"
      },
      17: {
        dimension: "mG",
        label: "Axis X"
      },
      18: {
        dimension: "mG",
        label: "Axis Y"
      },
      19: {
        dimension: "mG",
        label: "Axis Z"
      },
      20: {
        dimension: "%",
        label: "BLE Battery #2"
      },
      21: {
        label: "GSM Signal",
        values: {
          1: "5"
        }
      },
      22: {
        dimension: "%",
        label: "BLE Battery #3"
      },
      23: {
        dimension: "%",
        label: "BLE Battery #4"
      },
      24: {
        dimension: "km/h",
        label: "Speed"
      },
      25: {
        dimension: "C",
        label: "BLE Temperature #1"
      },
      26: {
        dimension: "C",
        label: "BLE Temperature #2"
      },
      27: {
        dimension: "C",
        label: "BLE Temperature #3"
      },
      28: {
        dimension: "C",
        label: "BLE Temperature #4"
      },
      29: {
        dimension: "%",
        label: "BLE Battery #1"
      },
      61: {
        label: "Geofence zone 06",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      62: {
        label: "Geofence zone 07",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      63: {
        label: "Geofence zone 08",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      64: {
        label: "Geofence zone 09",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      65: {
        label: "Geofence zone 10",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      66: {
        dimension: "mV",
        label: "External Voltage"
      },
      67: {
        dimension: "mV",
        label: "Battery Voltage"
      },
      68: {
        dimension: "mA",
        label: "Battery Current"
      },
      69: {
        label: "GNSS Status",
        values: {
          0: "GNSS OFF",
          1: "GNSS ON with fix",
          2: "GNSS ON without fix",
          3: "GNSS sleep"
        }
      },
      70: {
        label: "Geofence zone 11",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      71: {
        label: "Dallas Temperature ID 4"
      },
      72: {
        dimension: "0.1*C",
        label: "Dallas Temperature 1"
      },
      73: {
        dimension: "0.1*C",
        label: "Dallas Temperature 2"
      },
      74: {
        dimension: "0.1*C",
        label: "Dallas Temperature 3"
      },
      75: {
        dimension: "0.1*C",
        label: "Dallas Temperature 4"
      },
      76: {
        label: "Dallas Temperature ID 1"
      },
      77: {
        label: "Dallas Temperature ID 2"
      },
      78: {
        label: "iButton"
      },
      79: {
        label: "Dallas Temperature ID 3"
      },
      80: {
        label: "Data Mode",
        values: {
          0: "Home On Stop",
          1: "Home On Moving",
          2: "Roaming On Stop",
          3: "Roaming On Moving",
          4: "Unknown On Stop",
          5: "Unknown On Moving"
        }
      },
      86: {
        dimension: "%RH",
        label: "BLE Humidity #1"
      },
      88: {
        label: "Geofence zone 12",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      91: {
        label: "Geofence zone 13",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      92: {
        label: "Geofence zone 14",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      93: {
        label: "Geofence zone 15",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      94: {
        label: "Geofence zone 16",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      95: {
        label: "Geofence zone 17",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      96: {
        label: "Geofence zone 18",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      97: {
        label: "Geofence zone 19",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      98: {
        label: "Geofence zone 20",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      99: {
        label: "Geofence zone 21",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      104: {
        dimension: "%RH",
        label: "BLE Humidity #2"
      },
      106: {
        dimension: "%RH",
        label: "BLE Humidity #3"
      },
      108: {
        dimension: "%RH",
        label: "BLE Humidity #4"
      },
      113: {
        dimension: "%",
        label: "Battery Level"
      },
      116: {
        label: "Charger Connected",
        values: {
          0: "charger is not connected 1 "
        }
      },
      153: {
        label: "Geofence zone 22",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      154: {
        label: "Geofence zone 23",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      155: {
        label: "Geofence zone 01",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      156: {
        label: "Geofence zone 02",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      157: {
        label: "Geofence zone 03",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      158: {
        label: "Geofence zone 04",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      159: {
        label: "Geofence zone 05",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      175: {
        label: "Auto Geofence",
        values: {
          0: "target left zone",
          1: "target entered zone"
        }
      },
      179: {
        label: "Digital Output 1",
        values: {
          0: "0",
          1: "1"
        }
      },
      180: {
        label: "Digital Output 2"
      },
      181: {
        label: "GNSS PDOP"
      },
      182: {
        label: "GNSS HDOP"
      },
      190: {
        label: "Geofence zone 24",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      191: {
        label: "Geofence zone 25",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      192: {
        label: "Geofence zone 26",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      193: {
        label: "Geofence zone 27",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      194: {
        label: "Geofence zone 28",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      195: {
        label: "Geofence zone 29",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      196: {
        label: "Geofence zone 30",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      197: {
        label: "Geofence zone 31",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      198: {
        label: "Geofence zone 32",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      199: {
        dimension: "m",
        label: "Trip Odometer"
      },
      200: {
        label: "Sleep Mode",
        values: {
          0: "Sleep modes disabled",
          1: "GNSS sleep",
          2: "Deep sleep",
          3: "Online deep sleep",
          4: "Ultra deep sleep"
        }
      },
      205: {
        label: "GSM Cell ID"
      },
      206: {
        label: "GSM Area Code"
      },
      208: {
        label: "Geofence zone 33",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      209: {
        label: "Geofence zone 34",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      216: {
        label: "Geofence zone 35",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      217: {
        label: "Geofence zone 36",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      218: {
        label: "Geofence zone 37",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      219: {
        label: "Geofence zone 38",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      220: {
        label: "Geofence zone 39",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      221: {
        label: "Geofence zone 40",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      222: {
        label: "Geofence zone 41",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      223: {
        label: "Geofence zone 42",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      224: {
        label: "Geofence zone 43",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      225: {
        label: "Geofence zone 44",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      226: {
        label: "Geofence zone 45",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      227: {
        label: "Geofence zone 46",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      228: {
        label: "Geofence zone 47",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      229: {
        label: "Geofence zone 48",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      230: {
        label: "Geofence zone 49",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      231: {
        label: "Geofence zone 50",
        values: {
          0: "target left zone",
          1: "target entered zone",
          2: "over speeding end",
          3: "over speeding start"
        }
      },
      236: {
        label: "Alarm",
        values: {
          0: "Alarm event occured",
          1: "Reserved"
        }
      },
      239: {
        label: "Ignition",
        values: {
          0: "Ignition Off",
          1: "Ignition On"
        }
      },
      240: {
        label: "Movement",
        values: {
          0: "Movement Off",
          1: "Movement On"
        }
      },
      241: {
        label: "Active GSM Operator"
      },
      242: {
        label: "ManDown/FallDown",
        values: {
          0: "ManDown/FallDown deactivated",
          1: "ManDown/FalDown is active"
        }
      },
      243: {
        dimension: "ms",
        label: "Green driving event duration"
      },
      246: {
        label: "Towing",
        values: {
          0: "steady",
          1: "towing"
        }
      },
      247: {
        label: "Crash detection",
        values: {
          1: "crash",
          2: "limited crash trace (device not calibrated)",
          3: "limited crash trace (device is calibrated)",
          4: "full crash trace (device not calibrated)",
          5: "full crash trace (device is calibrated)",
          6: "crash detected (device not calibrated)"
        }
      },
      248: {
        label: "Immobilizer",
        values: {
          0: "iButton not connected",
          1: "iButton connected (Immobilizer)",
          2: "iButton connected (Authorized Driving)"
        }
      },
      249: {
        label: "Jamming",
        values: {
          0: "jamming stop",
          1: "jamming start"
        }
      },
      250: {
        label: "Trip",
        values: {
          0: "trip stop",
          1: "trip start"
        }
      },
      251: {
        label: "Idling",
        values: {
          0: "moving",
          1: "idling"
        }
      },
      252: {
        label: "Unplug",
        values: {
          0: "battery present",
          1: "battery unplug"
        }
      },
      253: {
        label: "Green driving type",
        values: {
          1: "harsh acceleration",
          2: "harsh braking",
          3: "harsh cornering"
        }
      },
      254: {
        dimension: "0.01*G|rad",
        label: "Green Driving Value"
      },
      255: {
        dimension: "km/h",
        label: "Overspeeding Event"
      },
      257: {
        label: "Crash trace data"
      },
      262: {
        label: "Digital Input 4",
        values: {
          0: "0",
          1: "1"
        }
      },
      263: {
        label: "BT Status",
        values: {
          0: "BT is disabled",
          1: "BT Enabled, not device connected",
          2: "Device connected, BTv3 Only",
          3: "Device connected, BLE only",
          4: "Device connected, BLE + BT"
        }
      },
      286: {
        label: "GSM Signal RX 0"
      },
      287: {
        label: "GSM Cell LAC 1"
      },
      288: {
        label: "GSM Cell ID 1"
      },
      289: {
        label: "GSM Signal RX 1"
      },
      290: {
        label: "GSM Cell LAC 2"
      },
      291: {
        label: "GSM Cell ID 2"
      },
      292: {
        label: "GSM Signal RX 2"
      },
      293: {
        label: "GSM Cell LAC 3"
      },
      294: {
        label: "GSM Cell ID 3"
      },
      295: {
        label: "GSM Signal RX 3"
      },
      296: {
        label: "GSM Cell LAC 4"
      },
      297: {
        label: "GSM Cell ID 4"
      },
      298: {
        label: "GSM Signal RX 4"
      },
      303: {
        label: "Instant Movement"
      },
      310: {
        label: "Movement Event",
        values: {
          0: "Movement event occurred",
          1: "No Movement event occured"
        }
      },
      331: {
        label: "BLE 1 Custom #1"
      },
      332: {
        label: "BLE 2 Custom #1"
      },
      333: {
        label: "BLE 3 Custom #1"
      },
      334: {
        label: "BLE 4 Custom #1"
      },
      385: {
        label: "Beacon ID's"
      },
      386: {
        dimension: "s",
        label: "Last Known Position"
      },
      387: {
        label: "ISO6709 Coordinates"
      },
      389: {
        label: "Button Click",
        values: {
          1: "1 click",
          2: "2 clicks",
          3: "long click",
          4: "button 2",
          5: "button 3"
        }
      },
      390: {
        label: "Power Event",
        values: {
          0: "Device turned ON",
          1: "Device turned OFF"
        }
      },
      399: {
        dimension: "s",
        label: "Time To First Fix"
      },
      400: {
        label: "Amber Alert state",
        values: {
          0: "Turned Off",
          1: "Turned On, count down timer started",
          2: "Amber Alert On button pressed to restard active timer",
          3: "Alarm",
          4: "Amber Alert turned On when timer is set to 0 seconds"
        }
      },
      401: {
        dimension: "s",
        label: "Amber Alert timer value"
      },
      403: {
        dimension: "BPM",
        label: "Heart Rate Alert"
      },
      463: {
        label: "BLE 1 Custom #2"
      },
      464: {
        label: "BLE 1 Custom #3"
      },
      465: {
        label: "BLE 1 Custom #4"
      },
      466: {
        label: "BLE 1 Custom #5"
      },
      467: {
        label: "BLE 2 Custom #2"
      },
      468: {
        label: "BLE 2 Custom #3"
      },
      469: {
        label: "BLE 2 Custom #4"
      },
      470: {
        label: "BLE 2 Custom #5"
      },
      471: {
        label: "BLE 3 Custom #2"
      },
      472: {
        label: "BLE 3 Custom #3"
      },
      473: {
        label: "BLE 3 Custom #4"
      },
      474: {
        label: "BLE 3 Custom #5"
      },
      475: {
        label: "BLE 4 Custom #2"
      },
      476: {
        label: "BLE 4 Custom #3"
      },
      477: {
        label: "BLE 4 Custom #4"
      },
      478: {
        label: "BLE 4 Custom #5"
      },
      520: {
        label: "Tamper detection Event",
        values: {
          0: "Tamper restore",
          1: "Tamper alarm"
        }
      },
      800: {
        dimension: "V",
        label: "Extended External Voltage"
      },
      801: {
        label: "Park Brake",
        values: {
          0: "Disengaged",
          1: "Engaged",
          2: "Error",
          3: "Unused"
        }
      },
      802: {
        label: "Selected",
        values: {
          0: "Disconnected",
          1: "Connected",
          2: "Error",
          3: "Unused"
        }
      },
      803: {
        label: "Selected Charge Mode",
        values: {
          0: "Default",
          1: "Fast"
        }
      },
      804: {
        dimension: "mA",
        label: "Charger Current"
      },
      805: {
        dimension: "mA",
        label: "Charger Current"
      },
      806: {
        label: "Charger Control Mode",
        values: {
          0: "Remote Control C",
          1: "Open Circuit"
        }
      },
      807: {
        label: "Charger BMS COM Timeout",
        values: {
          0: "Expired",
          1: "Not expired"
        }
      },
      808: {
        label: "Charger CRC Violation",
        values: {
          0: "No CRC Violation happened",
          1: "CRC Violation happened"
        }
      },
      809: {
        label: "Charger MC Violation",
        values: {
          0: "No MC Violation happened",
          1: "MC Violation happened"
        }
      },
      810: {
        label: "Charger Status",
        values: {
          0: "No Errorbr",
          1: "Minimal Current Limiting",
          2: "Reverse Polarity",
          3: "Reserved",
          4: "Cable Voltage Drop",
          5: "Fan Error",
          6: "AC Undervoltage Disconnect",
          7: "Not Ready For Charging"
        }
      },
      811: {
        dimension: "mV",
        label: "Charger Voltage Actual"
      },
      812: {
        dimension: "mV",
        label: "Charger Internal Fault"
      },
      813: {
        dimension: "Wh",
        label: "Charger Energy"
      },
      814: {
        dimension: "mA",
        label: "Charger Current Actual"
      },
      815: {
        dimension: "%",
        label: "Throttle Position"
      },
      816: {
        label: "Brake Pressed"
      },
      817: {
        label: "Charge Plugged"
      },
      818: {
        label: "Kill Switch Active"
      },
      819: {
        label: "Kistand Release Status"
      },
      820: {
        label: "Powerstrain State"
      },
      821: {
        label: "Malfunction Indication"
      },
      822: {
        dimension: "km",
        label: "Estimated Range"
      },
      823: {
        dimension: "%",
        label: "SoH Battery"
      },
      824: {
        dimension: "%",
        label: "SoC Battery"
      },
      825: {
        label: "Vehicle available",
        values: {
          0: "Vehicle Not Available",
          1: "Vehicle Available"
        }
      },
      826: {
        label: "Charging Active",
        values: {
          0: "Charging Not Active",
          1: "Charging Active"
        }
      },
      827: {
        dimension: "min",
        label: "Remaining Charge Time"
      },
      828: {
        dimension: "Ah",
        label: "Remaining Capacity"
      },
      829: {
        dimension: "Ah",
        label: "Full Charge Capacity"
      },
      830: {
        label: "Driving direction",
        values: {
          0: "Park",
          1: "Reverse",
          2: "Forward",
          3: "Neutral"
        }
      },
      831: {
        label: "Drive Mode"
      },
      832: {
        label: "Park Brake Active",
        values: {
          0: "Park Brake Not Active",
          1: "Park Brake Active"
        }
      },
      833: {
        dimension: "km",
        label: "Total Distance"
      },
      834: {
        dimension: "m",
        label: "Trip Distance"
      },
      835: {
        dimension: "km/h",
        label: "Vehicle Speed"
      },
      836: {
        label: "Ignition Status"
      },
      837: {
        label: "Ignition Fast Status",
        values: {
          0: "not active",
          1: "active"
        }
      },
      838: {
        dimension: "Wh/km",
        label: "Power Consumption"
      },
      839: {
        dimension: "V",
        label: "Extended Analog Input 1"
      },
      840: {
        dimension: "V",
        label: "Extended Analog Input 2"
      },
      841: {
        label: "DOUT 1 Overcurrent"
      },
      842: {
        label: "DOUT2 Overcurrent"
      },
      843: {
        label: "Helmet Status",
        values: {
          0: "not in",
          1: "in"
        }
      },
      844: {
        label: "Top Case Sensor"
      },
      845: {
        label: "Central Stand Up",
        values: {
          0: "down",
          1: "up"
        }
      },
      846: {
        label: "Emergency",
        values: {
          0: "no emergency",
          1: "emergency"
        }
      },
      847: {
        label: "Over-Under Temperature",
        values: {
          0: "normal temperature",
          1: "over/under temperature"
        }
      },
      848: {
        label: "Regeneration Disabled",
        values: {
          0: "enabled",
          1: "disabled"
        }
      },
      849: {
        label: "Battery On/Off",
        values: {
          0: "Battery Off",
          1: "Battery On"
        }
      },
      850: {
        label: "Warning UnderVoltage",
        values: {
          0: "no battery undervoltage",
          1: "battery undervoltage"
        }
      },
      851: {
        label: "Warning OverVoltage",
        values: {
          0: "No battery overvoltage",
          1: "battery overvoltage"
        }
      },
      852: {
        label: "Warning OverCurrent",
        values: {
          0: "No battery overcurrent",
          1: "battery overcurrent"
        }
      },
      853: {
        label: "Warning Short Circuit",
        values: {
          0: "No battery short circuit",
          1: "battery short circuit"
        }
      },
      854: {
        label: "User ID"
      },
      855: {
        label: "Power",
        values: {
          0: "Power Off",
          1: "Power ON"
        }
      },
      856: {
        label: "Current Trip Range"
      },
      857: {
        label: "Total Trip Range"
      },
      858: {
        label: "Battery Capacity"
      },
      859: {
        label: "Low Voltage"
      },
      860: {
        label: "High Temperature"
      },
      861: {
        label: "Upload Time"
      },
      862: {
        label: "Moving Abnormal"
      },
      863: {
        dimension: "km",
        label: "Range"
      },
      864: {
        label: "Lock Status"
      },
      865: {
        label: "Vehicle FW version"
      },
      866: {
        dimension: "m",
        label: "Total Range"
      },
      867: {
        dimension: "kW*h",
        label: "Battery Energy"
      },
      868: {
        label: "Power System Error"
      },
      869: {
        label: "Power Train Error"
      },
      870: {
        label: "Instrument System Error"
      },
      871: {
        label: "BLE Lock Status",
        values: {
          0: "Unlocked",
          1: "Locked On"
        }
      },
      872: {
        dimension: "%",
        label: "BLE Lock Battery"
      },
      873: {
        dimension: "",
        label: "BLE Lock Discovered"
      },
      874: {
        label: "Bluetooth Home Zone Violation state",
        values: {
          0: "None",
          1: "Movement (Only for Ela MOV sensor)",
          2: "RSSI threshold violation",
          4: "BLE missing"
        }
      },
      875: {
        label: "Proximity violation source with Teltonika devices",
        values: {
          3031343731353942383241454643: "> 0147159B82AEFC"
        }
      },
      876: {
        label: "Proximity violation source with iBeacons"
      },
      889: {
        label: "Proximity Violation state",
        values: {
          0: "End of RSSI violation",
          1: "RSSI threshold violation"
        }
      },
      890: {
        dimension: "s",
        label: "Proximity duration"
      },
      891: {
        label: "BLE MAC address"
      },
      900: {
        label: "Manual CAN 0"
      },
      901: {
        label: "Manual CAN 1"
      },
      902: {
        label: "Manual CAN 2"
      },
      903: {
        label: "Manual CAN 3"
      },
      904: {
        label: "Manual CAN 4"
      },
      905: {
        label: "Manual CAN 5"
      },
      906: {
        label: "Manual CAN 6"
      },
      907: {
        label: "Manual CAN 7"
      },
      908: {
        label: "Manual CAN 8"
      },
      909: {
        label: "Manual CAN 9"
      },
      910: {
        label: "Manual CAN 10"
      },
      911: {
        label: "Manual CAN 11"
      },
      912: {
        label: "Manual CAN 12"
      },
      913: {
        label: "Manual CAN 13"
      },
      914: {
        label: "Manual CAN 14"
      },
      915: {
        label: "Manual CAN 15"
      },
      916: {
        label: "Manual CAN 16"
      },
      917: {
        label: "Manual CAN 17"
      },
      918: {
        label: "Manual CAN 18"
      },
      919: {
        label: "Manual CAN 19"
      },
      920: {
        label: "Manual CAN 20"
      },
      921: {
        label: "Manual CAN 21"
      },
      922: {
        label: "Manual CAN 22"
      },
      923: {
        label: "Manual CAN 23"
      },
      924: {
        label: "Manual CAN 24"
      },
      925: {
        label: "Manual CAN 25"
      },
      926: {
        label: "Manual CAN 26"
      },
      927: {
        label: "Manual CAN 27"
      },
      928: {
        label: "Manual CAN 28"
      },
      929: {
        label: "Manual CAN 29"
      },
      930: {
        label: "Accelerator Pedal 1 Low Idle Switch",
        values: {
          0: "Accelerator pedal 1 not in low idle condition",
          1: "Accelerator pedal 1 in low idle condition",
          2: "Error",
          3: "Not available"
        }
      },
      931: {
        label: "Accelerator Pedal Kickdown Switch",
        values: {
          0: "Kickdown passive",
          1: "Kickdown active",
          2: "Error",
          3: "Not available"
        }
      },
      932: {
        label: "Road Speed Limit Status",
        values: {
          0: "Active",
          1: "Not Active",
          2: "Error",
          3: "Not available"
        }
      },
      933: {
        label: "Accelerator Pedal 2 Low Idle Switch",
        values: {
          0: "Accelerator pedal 2 not in low idle condition",
          1: "Accelerator pedal 2 in low idle condition",
          2: "Error",
          3: "Not available"
        }
      },
      934: {
        dimension: "%",
        label: "Accelerator Pedal Position 1"
      },
      936: {
        dimension: "%",
        label: "Engine Percent Load At Current Speed"
      },
      937: {
        dimension: "%",
        label: "Remote Accelerator Pedal Position"
      },
      938: {
        dimension: "%",
        label: "Accelerator Pedal 2 Position"
      },
      939: {
        label: "Vehicle Acceleration Rate Limit Status",
        values: {
          0: "Limit not active",
          1: "Limit active",
          2: "Reserved",
          3: "Not available"
        }
      },
      940: {
        label: "Momentary Engine Maximum Power Enable Feedback",
        values: {
          0: "disabled",
          1: "supported",
          2: "reserved",
          3: "don't care"
        }
      },
      941: {
        label: "DPF Thermal Management Active",
        values: {
          0: "DPF Thermal Management is not active",
          1: "DPF Thermal Management is active",
          2: "Reserved",
          3: "Don't care"
        }
      },
      942: {
        label: "SCR Thermal Management Active",
        values: {
          0: "SCR Thermal Management is not active",
          1: "SCR Thermal Management is active",
          2: "Reserved",
          3: "Don't care"
        }
      },
      943: {
        dimension: "%",
        label: "Actual Maximum Available Engine - Percent Torque"
      },
      944: {
        dimension: "%",
        label: "Estimated Pumping - Percent Torque"
      },
      945: {
        label: "Engine Torque Mode",
        values: {
          0: "\u201cNo request\u201d: engine torque may range from 0 to full load only due to low idle governor output",
          15: ""
        }
      },
      946: {
        dimension: "%",
        label: "Actual Engine - Percent Torque (Fractional)"
      },
      947: {
        dimension: "%",
        label: "Driver\u2019s Demand Engine - Percent Torque"
      },
      948: {
        dimension: "%",
        label: "Actual Engine - Percent Torque"
      },
      949: {
        dimension: "rpm",
        label: "Engine Speed"
      },
      950: {
        dimension: "SA",
        label: "Source Address of Controlling Device for Engine Control"
      },
      951: {
        label: "Engine Starter Mode",
        values: {
          0: "start not requested",
          1: "starter active but not engaged",
          2: "starter active and engaged",
          3: "start finished, starter not active after having been actively engaged (after 50ms mode goes to 0)",
          4: "starter inhibited due to engine already running",
          5: "starter inhibited due to engine not ready for start (preheating)",
          6: "starter inhibited due to driveline engaged or other transmission inhibit",
          7: "starter inhibited due to active immobilizer",
          8: "starter inhibited due to starter over",
          9: "starter inhibited due to intake air shutoff valve being active",
          10: "starter inhibited due to active emissions control system condition",
          11: "starter inhibited due to ignition key cycle required",
          12: "starter inhibited",
          13: "error (legacy implementation only, use 14)",
          14: "error",
          15: "not available"
        }
      },
      952: {
        dimension: "%",
        label: "Engine Demand \u2013 Percent Torque"
      },
      953: {
        dimension: "C",
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Intake Temperature"
      },
      954: {
        dimension: "C",
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Outlet Temperature"
      },
      955: {
        dimension: "kPa",
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Differential Pressure"
      },
      956: {
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Intake Temperature Preliminary FMI"
      },
      957: {
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Outlet Temperature Preliminary FMI"
      },
      958: {
        label: "Aftertreatment 1 Diesel Oxidation Catalyst Differential Pressure Preliminary FMI"
      },
      959: {
        dimension: "%",
        label: "Aftertreatment 1 Diesel Particulate Filter Soot Load Percent"
      },
      960: {
        dimension: "%",
        label: "Aftertreatment 1 Diesel Particulate Filter Ash Load Percent"
      },
      961: {
        dimension: "s",
        label: "Aftertreatment 1 Diesel Particulate Filter Time Since Last Active Regeneration"
      },
      962: {
        dimension: "%",
        label: "Aftertreatment 1 Diesel Particulate Filter Soot Load Regeneration Threshold"
      },
      963: {
        dimension: "C",
        label: "Aftertreatment 1 Exhaust Temperature 2"
      },
      964: {
        dimension: "C",
        label: "Aftertreatment 1 Diesel Particulate Filter Intermediate Temperature"
      },
      965: {
        dimension: "kPa",
        label: "Aftertreatment 1 Diesel Particulate Filter Differential Pressure"
      },
      966: {
        label: "Aftertreatment 1 Exhaust Temperature 2 Preliminary FMI"
      },
      967: {
        label: "Aftertreatment 1 Diesel Particulate Filter Differential Pressure Preliminary FMI"
      },
      968: {
        label: "Aftertreatment 1 Diesel Particulate Filter Intermediate Temperature Preliminary FMI"
      },
      969: {
        dimension: "C",
        label: "Aftertreatment 1 Exhaust Temperature 1"
      },
      970: {
        dimension: "C",
        label: "Aftertreatment 1 Diesel Particulate Filter Intake Temperature"
      },
      971: {
        label: "Aftertreatment 1 Exhaust Temperature 1 Preliminary FMI"
      },
      972: {
        label: "Aftertreatment 1 Diesel Particulate Filter Intake Temperature Preliminary FMI"
      },
      973: {
        dimension: "kg",
        label: "Trip Fuel (Gaseous)"
      },
      974: {
        dimension: "kg",
        label: "Total Fuel Used (Gaseous)"
      },
      989: {
        dimension: "km",
        label: "Trip Vehicle Distance"
      },
      990: {
        dimension: "km",
        label: "Total Vehicle Distance"
      },
      991: {
        dimension: "h",
        label: "Engine Total Hours of Operation"
      },
      992: {
        dimension: "r",
        label: "Engine Total Revolutions"
      },
      993: {
        dimension: "h",
        label: "Total Vehicle Hours"
      },
      994: {
        dimension: "h",
        label: "Total Power Takeoff Hours"
      },
      995: {
        dimension: "l",
        label: "Engine Trip Fuel"
      },
      996: {
        dimension: "l",
        label: "Engine Total Fuel Used"
      },
      1002: {
        dimension: "C",
        label: "Engine Coolant Temperature"
      },
      1003: {
        dimension: "C",
        label: "Engine Fuel 1 Temperature 1"
      },
      1004: {
        dimension: "C",
        label: "Engine Oil Temperature 1"
      },
      1005: {
        dimension: "C",
        label: "Engine Turbocharger 1 Oil Temperature"
      },
      1006: {
        dimension: "C",
        label: "Engine Intercooler Temperature"
      },
      1007: {
        dimension: "%",
        label: "Engine Charge Air Cooler Thermostat Opening"
      },
      1008: {
        dimension: "kPa",
        label: "Engine Fuel Delivery Pressure"
      },
      1009: {
        dimension: "kPa",
        label: "Engine Extended Crankcase Blow-by Pressure"
      },
      1010: {
        dimension: "%",
        label: "Engine Oil Level"
      },
      1011: {
        dimension: "kPa",
        label: "Engine Oil Pressure 1"
      },
      1012: {
        dimension: "kPa",
        label: "Engine Crankcase Pressure 1"
      },
      1013: {
        dimension: "kPa",
        label: "Engine Coolant Pressure 1"
      },
      1014: {
        dimension: "%",
        label: "Engine Coolant Level 1"
      },
      1015: {
        label: "Two Speed Axle Switch",
        values: {
          0: "Low speed range",
          1: "High speed range",
          2: "Error",
          3: "Not available"
        }
      },
      1016: {
        label: "Two Speed Axle Switch",
        values: {
          0: "Parking brake not set",
          1: "Parking brake set",
          2: "Error",
          3: "Not available"
        }
      },
      1017: {
        label: "Cruise Control Pause Switch",
        values: {
          0: "Off",
          1: "On",
          2: "Error Indicator",
          3: "Take No Action"
        }
      },
      1018: {
        label: "Park Brake Release Inhibit Request",
        values: {
          0: "Park Brake Release Inhibit not requested",
          1: "Park Brake Release Inhibit requested",
          2: "SAE reserved",
          3: "Unavailable"
        }
      },
      1019: {
        dimension: "km/h",
        label: "Wheel-Based Vehicle Speed"
      },
      1020: {
        label: "Cruise Control Active",
        values: {
          0: "Cruise control switched off",
          1: "Cruise control switched on",
          2: "Error",
          3: "Not available"
        }
      },
      1021: {
        label: "Cruise Control Enable Switch",
        values: {
          0: "Cruise control disabled",
          1: "Cruise control enabled",
          2: "Error",
          3: "Not available"
        }
      },
      1022: {
        label: "Brake Switch",
        values: {
          0: "Brake pedal released",
          1: "Brake pedal depressed",
          2: "Error",
          3: "Not Available"
        }
      },
      1023: {
        label: "Clutch Switch",
        values: {
          0: "Clutch pedal released",
          1: "Clutch pedal",
          2: "Error",
          3: "Not available"
        }
      },
      1024: {
        label: "Cruise Control Set Switch",
        values: {
          0: "Cruise control activator not in the position 'set'",
          1: "Cruise control activator in position 'set'",
          2: "Error",
          3: "Not available"
        }
      },
      1025: {
        label: "Cruise Control Coast (Decelerate) Switch",
        values: {
          0: "Cruise control activator not in the position 'coast'",
          1: "Cruise control activator in position 'coast'",
          2: "Error",
          3: "Not available"
        }
      },
      1026: {
        label: "Cruise Control Resume Switch",
        values: {
          0: "Cruise control activator not in the position 'resume'",
          1: "Cruise control activator in position 'resume'",
          2: "Error",
          3: "Not available"
        }
      },
      1027: {
        label: "Cruise Control Accelerate Switch",
        values: {
          0: "Cruise control activator not in the position 'accelerate'",
          1: "Cruise control activator in position 'accelerate'",
          2: "Error",
          3: "Not available"
        }
      },
      1028: {
        dimension: "km/h",
        label: "Cruise Control Set Speed"
      },
      1029: {
        label: "PTO Governor State",
        values: {
          0: "Cruise control switched off",
          1: "Cruise control switched on",
          2: "Error",
          3: "Not available"
        }
      },
      1030: {
        label: "Cruise Control States",
        values: {
          0: "Off/Disabled",
          1: "Hold",
          2: "Remote Hold",
          3: "Standby",
          4: "Remote Standby",
          5: "Set",
          6: "Decelerate/Coast",
          7: "Resume",
          8: "Accelerate",
          9: "Accelerator Override",
          10: "Preprogrammed set speed 1",
          11: "Preprogrammed set speed 2",
          12: "Preprogrammed set speed 3",
          13: "Preprogrammed set speed 4",
          14: "Preprogrammed set speed 5",
          15: "Preprogrammed set speed 6",
          16: "Preprogrammed set speed 7",
          17: "Preprogrammed set speed 8",
          18: "PTO set speed memory 1",
          19: "PTO set speed memory 2",
          20: "PTO set speed memory 3",
          21: "Reserved",
          22: "Reserved",
          23: "Reserved",
          24: "Reserved",
          25: "Reserved",
          26: "Reserved",
          27: "Reserved",
          28: "Reserved",
          29: "Reserved",
          30: "Reserved",
          31: "Not available"
        }
      },
      1031: {
        label: "Engine Idle Increment Switch",
        values: {
          0: "Off/Disabled",
          1: "Hold",
          2: "Accelerate",
          3: "Decelerate",
          4: "Resume",
          5: "Set",
          6: "Accelerator Override",
          7: "Not available"
        }
      },
      1032: {
        label: "Engine Idle Decrement Switch",
        values: {
          0: "Off",
          1: "On",
          2: "Error",
          3: "Not available"
        }
      },
      1033: {
        label: "Engine Diagnostic Test Mode Switch",
        values: {
          0: "Off",
          1: "On",
          2: "Error",
          3: "Not available"
        }
      },
      1034: {
        label: "Engine Shutdown Override Switch",
        values: {
          0: "Off",
          1: "On",
          2: "Error",
          3: "Not available"
        }
      },
      1035: {
        dimension: "l/h",
        label: "Engine Fuel Rate"
      },
      1036: {
        dimension: "km/L",
        label: "Engine Instantaneous Fuel Economy"
      },
      1037: {
        dimension: "km/L",
        label: "Engine Average Fuel Economy"
      },
      1038: {
        dimension: "%",
        label: "Engine Throttle Valve 1 Position 1"
      },
      1039: {
        dimension: "%",
        label: "Engine Throttle Valve 2 Position"
      },
      1040: {
        dimension: "kPa",
        label: "Barometric Pressure"
      },
      1041: {
        dimension: "C",
        label: "Cab Interior Temperature"
      },
      1042: {
        dimension: "C",
        label: "Ambient Air Temperature"
      },
      1043: {
        dimension: "C",
        label: "Engine Intake 1 Air Temperature"
      },
      1044: {
        dimension: "C",
        label: "Road Surface Temperature"
      },
      1045: {
        dimension: "kPa",
        label: "Aftertreatment 1 Diesel Particulate Filter Intake Pressure"
      },
      1046: {
        dimension: "kPa",
        label: "Engine Intake Manifold #1 Pressure"
      },
      1047: {
        dimension: "C",
        label: "Engine Intake Manifold 1 Temperature"
      },
      1048: {
        dimension: "kPa",
        label: "Engine Intake Air Pressure"
      },
      1049: {
        dimension: "kPa",
        label: "Engine Air Filter 1 Differential Pressure"
      },
      1050: {
        dimension: "C",
        label: "Engine Exhaust Temperature"
      },
      1051: {
        dimension: "kPa",
        label: "Engine Coolant Filter Differential Pressure"
      },
      1052: {
        dimension: "A",
        label: "SLI Battery 1 Net Current"
      },
      1053: {
        dimension: "A",
        label: "Alternator Current"
      },
      1054: {
        dimension: "V",
        label: "Charging System Potential (Voltage)"
      },
      1055: {
        dimension: "V",
        label: "Battery Potential / Power Input 1"
      },
      1056: {
        dimension: "V",
        label: "Key Switch Battery Potential"
      },
      1057: {
        dimension: "kPa",
        label: "Transmission Clutch 1 Pressure"
      },
      1058: {
        dimension: "%",
        label: "Transmission Oil Level 1"
      },
      1059: {
        dimension: "kPa",
        label: "Transmission Filter Differential Pressure"
      },
      1060: {
        dimension: "kPa",
        label: "Transmission 1 Oil Pressure"
      },
      1061: {
        dimension: "C",
        label: "Transmission Oil Temperature 1"
      },
      1062: {
        dimension: "l",
        label: "Transmission Oil Level 1 High / Low"
      },
      1063: {
        label: "Transmission Oil Level 1 Countdown Timer",
        values: {
          0: "less than 1 minute",
          1: "One minute",
          2: "Two minutes",
          3: "Three minutes",
          4: "Four minutes",
          5: "Five minutes",
          6: "Six minutes",
          7: "Seven minutes",
          8: "Eight minutes",
          9: "Nine minutes",
          10: "Ten minutes",
          11: "Eleven minutes",
          12: "Twelve minutes",
          13: "Thirteen minutes",
          14: "Error",
          15: "Not Available"
        }
      },
      1064: {
        label: "Transmission Oil Level 1 Measurement Status",
        values: {
          0: "Conditions valid for transmission oil level measurement",
          1: "Conditions not valid \u2013 Settling timer still counting down",
          2: "Conditions not valid \u2013 Transmission in gear",
          3: "Conditions not valid \u2013 Transmission fluid temperature too low",
          4: "Conditions not valid \u2013 Transmission fluid temperature too high",
          5: "Conditions not valid \u2013 Vehicle moving, output shaft speed too high",
          6: "Conditions not valid \u2013 Vehicle not level",
          7: "Conditions not valid \u2013 Engine speed too low",
          8: "Conditions not valid \u2013 Engine speed too high",
          9: "Conditions not valid \u2013 No request for reading",
          10: "Not defined",
          11: "Not defined",
          12: "Not defined",
          13: "Conditions not valid",
          14: "Error",
          15: "Not available"
        }
      },
      1065: {
        dimension: "%",
        label: "Washer Fluid Level"
      },
      1066: {
        dimension: "%",
        label: "Fuel Level 1"
      },
      1067: {
        dimension: "kPa",
        label: "Engine Fuel Filter Differential Pressure"
      },
      1068: {
        dimension: "kPa",
        label: "Engine Oil Filter Differential Pressure"
      },
      1069: {
        dimension: "C",
        label: "Cargo Ambient Temperature"
      },
      1070: {
        dimension: "%",
        label: "Fuel Level 2"
      },
      1071: {
        dimension: "kPa",
        label: "Engine Oil Filter Differential Pressure (Extended Range)"
      },
      1100: {
        dimension: "C",
        label: "BMS0 Temperature Current Max"
      },
      1101: {
        dimension: "C",
        label: "BMS0 Temperature Current Min"
      },
      1104: {
        dimension: "C",
        label: "BMS1 Temperature Current Max"
      },
      1105: {
        dimension: "C",
        label: "BMS1 Temperature Current Min"
      },
      1106: {
        dimension: "mV",
        label: "BMS1 Voltage Cell Min"
      },
      1107: {
        dimension: "mV",
        label: "BMS1 Voltage Cell Max"
      },
      1121: {
        label: "CAN Unlocked"
      },
      1122: {
        dimension: "C",
        label: "BMS2 Temperature Current Max"
      },
      1123: {
        dimension: "C",
        label: "BMS2 Temperature Current Min"
      },
      1124: {
        dimension: "mV",
        label: "BMS2 Voltage Cell Min"
      },
      1125: {
        dimension: "mV",
        label: "BMS2 Voltage Cell Max"
      },
      1126: {
        dimension: "W",
        label: "Max Available Power"
      },
      1127: {
        label: "Handlebar Lock"
      },
      1128: {
        label: "Rear Brake Pressed"
      },
      1129: {
        label: "COM Error"
      },
      1130: {
        dimension: "rpm",
        label: "RPM"
      },
      1131: {
        dimension: "A",
        label: "Torque Current"
      },
      1132: {
        label: "SN High"
      },
      1133: {
        label: "SN Low"
      },
      1134: {
        dimension: "mV",
        label: "Lowest Battery Voltage"
      },
      1135: {
        label: "Lowest Battery ID"
      },
      1136: {
        dimension: "mV",
        label: "Highest Battery Voltage"
      },
      1137: {
        label: "Highest Battery ID"
      },
      1138: {
        dimension: "mV",
        label: "Highest Mismatch Voltage"
      },
      1139: {
        label: "Highest Mismatch ID"
      },
      1140: {
        dimension: "C",
        label: "Lowest Battery Temperature"
      },
      1141: {
        label: "Lowest Temperature Battery ID"
      },
      1142: {
        dimension: "C",
        label: "Highest Battery Temperature"
      },
      1143: {
        label: "Highest Temperature Battery ID"
      },
      1144: {
        dimension: "s",
        label: "Time To Full Load"
      },
      1145: {
        dimension: "s",
        label: "Time To Empty"
      },
      1146: {
        dimension: "s",
        label: "Time To Full"
      },
      1147: {
        label: "Cluster State"
      },
      1148: {
        dimension: "%",
        label: "Cluster SoC"
      },
      1149: {
        dimension: "A",
        label: "Max Discharge Current"
      },
      1150: {
        label: "Recuperation Allowed"
      },
      1151: {
        label: "Switch Process Needed"
      },
      1152: {
        dimension: "%",
        label: "SoC Switch Level"
      },
      1153: {
        dimension: "Ah",
        label: "Part Charge Capacity"
      },
      1154: {
        dimension: "V",
        label: "Cluster Voltage"
      },
      1155: {
        dimension: "A",
        label: "Cluster Current"
      },
      1156: {
        label: "Major Version"
      },
      1157: {
        label: "Minor Version"
      },
      1158: {
        label: "Patch Version"
      },
      1159: {
        label: "Recognized Batteries"
      },
      1160: {
        label: "Activated Batteries"
      },
      1161: {
        label: "Faulty Batteries"
      },
      1162: {
        dimension: "V",
        label: "Battery 1 Voltage"
      },
      1163: {
        dimension: "A",
        label: "Battery 1 Current"
      },
      1164: {
        label: "Battery 1 State"
      },
      1165: {
        dimension: "%",
        label: "Battery 1 SoC"
      },
      1166: {
        dimension: "C",
        label: "Battery 1 Temperature 1"
      },
      1167: {
        dimension: "C",
        label: "Battery 1 Temperature 2"
      },
      1168: {
        dimension: "C",
        label: "Battery 1 Power Stage Temp"
      },
      1169: {
        dimension: "mAh",
        label: "Battery 1 Remaining Capacity"
      },
      1170: {
        dimension: "V",
        label: "Battery 2 Voltage"
      },
      1171: {
        dimension: "A",
        label: "Battery 2 Current"
      },
      1172: {
        label: "Battery 2 State"
      },
      1173: {
        dimension: "%",
        label: "Battery 2 SoC"
      },
      1174: {
        dimension: "C",
        label: "Battery 2 Temperature 1"
      },
      1175: {
        dimension: "C",
        label: "Battery 2 Temperature 2"
      },
      1176: {
        dimension: "C",
        label: "Battery 2 Power Stage Temp"
      },
      1177: {
        dimension: "mAh",
        label: "Battery 2 Remaining Capacity"
      },
      1178: {
        label: "Battery ID 0 Error Code"
      },
      1179: {
        label: "Battery ID 1 Error Code"
      },
      1180: {
        label: "Cluster Error Code"
      },
      1181: {
        dimension: "A",
        label: "Max Charge Current"
      },
      1182: {
        dimension: "C",
        label: "Lowest Battery 2 Temperature"
      },
      1183: {
        dimension: "C",
        label: "Highest Battery 2 Temperature"
      },
      1184: {
        dimension: "mV",
        label: "Lowest Battery 2 Voltage"
      },
      1185: {
        dimension: "mV",
        label: "Highest Battery 2 Voltage"
      },
      1200: {
        label: "GSM Cell MNC 1"
      },
      1201: {
        label: "GSM Cell MNC 2"
      },
      1202: {
        label: "GSM Cell MNC 3"
      },
      1203: {
        label: "GSM Cell MNC 4"
      },
      11002: {
        dimension: "mV",
        label: "BMS0 Voltage Cell Min"
      },
      11003: {
        dimension: "mV",
        label: "BMS0 Voltage Cell Max"
      }
    }
  }
}

module.exports = Codec8e;
