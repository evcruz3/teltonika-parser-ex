'use strict';

const binutils = require('binutils64');
const Codec = require('./codec');
const NodeGeocoder = require('node-geocoder');

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

    // Insert reverse geocoding here
    avlRecord.gps.valueHuman = this.reverseGeocode(avlRecord.gps)


    avlRecord.ioElements = this.parseIoElements();

    this.avlObj.records.push(avlRecord);
  }

  reverseGeocode(gps){
    const options = {
      provider: 'google',
    
      // Optional depending on the providers
      //fetch: customFetchImplementation,
      //apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
      //formatter: null // 'gpx', 'string', ...
    };

    const geocoder = NodeGeocoder(options);

    geocoder.reverse({lat:gps.latitude, lon:gps.longitude})
    .then((res)=> {
      return res;
    })
    .catch((err)=> {
      console.log(err);
    });
    
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
      let value = this.toString(this.reader.ReadBytes(ioValueLength));
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
        label: 'Din 1',
        values: {
          0: '0',
          1: '1',
        },
      },
      2: {
        label: 'Din 2',
        values: {
            0: '0',
            1: '1',
        },
      },
      3: {
        label: 'Din 3',
        values: {
            0: '0',
            1: '1',
        },
      },
      6: { //
        label: 'Analog Input 2',
        dimension: 'mV'
      },
      9: { //
        label: 'Analog Input 1',
        dimension: 'mV'
      },
      10: {
        label: 'SD Status',
        values: {
          0: 'Not present',
          1: 'Present',
        },
      },
      11: {
        label: 'ICCID1',
      },
      12: {
        label: 'Fuel Used GPS',
      },
      13: {
        label: 'Average Fuel Use',
        dimension: 'L / 100 km',
      },
      14: {
        label: 'ICCID2',
      },
      15: { //
        label: 'Eco Score',
      },
      16: { //
        label: 'Total Odometer',
        dimension: 'm'
      },
      17: { //
        label: 'Accelerometer X axis',
      },
      18: { //
        label: 'Accelerometer Y axis',
      },
      19: { //
        label: 'Accelerometer Z axis',
      },
      20: {
        label: 'BLE 2 Battery Voltage',
        dimension: '%',
      },
      21: { //
        label: 'GSM Signal Strength',
        values: {
          1: '1',
          2: '2',
          3: '3',
          4: '4',
          5: '5',
        },
      },
      22: {
        label: 'BLE 3 Battery Voltage',
        dimension: '%',
      },
      23: {
        label: 'BLE 4 Battery Voltage',
        dimension: '%',
      },
      24: { //
        label: 'Speed',
        dimension: 'km/h',
      },
      25: {
        label: 'BLE 1 Temperature',
        dimension: 'C',
      },
      26: {
        label: 'BLE 2 Temperature',
        dimension: 'C',
      },
      27: {
        label: 'BLE 3 Temperature',
        dimension: 'C',
      },
      28: {
        label: 'BLE 4 Temperature',
        dimension: 'C',
      },
      29: {
        label: 'BLE 1 Battery Voltage',
        dimension: '%',
      },
      30: {
        label: 'Number of DTC',
      },
      31: {
        label: 'Calculated engine load value',
        dimension: '%',
      },
      32: {
        label: 'Engine coolant temperature',
        dimension: 'C',
      },
      33: {
        label: 'Short term fuel trim 1',
        dimension: '%',
      },
      34: {
        label: 'Fuel pressure',
        dimension: 'kPa',
      },
      35: {
        label: 'Intake manifold absolute pressure',
        dimension: 'kPa',
      },
      36: {
        label: 'Engine RPM',
        dimension: 'rpm',
      },
      37: {
        label: 'Vehicle speed',
        dimension: 'km/h',
      },
      38: {
        label: 'Timing advance',
        dimension: 'O',
      },
      39: {
        label: 'Intake air temperature',
        dimension: 'C',
      },
      40: {
        label: 'MAF air flow rate',
        dimension: 'g/sec, *0.01',
      },
      41: {
        label: 'Throttle position',
        dimension: '%',
      },
      42: {
        label: 'Run time since engine start',
        dimension: 's',
      },
      43: {
        label: 'Distance traveled MIL on',
        dimension: 'Km',
      },
      44: {
        label: 'Relative fuel rail pressure',
        dimension: 'kPa*0.1',
      },
      45: {
        label: 'Direct fuel rail pressure',
        dimension: 'kPa*0.1',
      },
      46: {
        label: 'Commanded EGR',
        dimension: '%',
      },
      47: {
        label: 'EGR error',
        dimension: '%',
      },
      48: {
        label: 'Fuel level',
        dimension: '%',
      },
      49: {
        label: 'Distance traveled since codes cleared',
        dimension: 'Km',
      },
      50: {
        label: 'Barometric pressure',
        dimension: 'kPa',
      },
      51: {
        label: 'Control module voltage',
        dimension: 'mV',
      },
      52: {
        label: 'Absolute load value',
        dimension: '%',
      },
      53: {
        label: 'Ambient air temperature',
        dimension: 'C',
      },
      54: {
        label: 'Time run with MIL on',
        dimension: 'min',
      },
      55: {
        label: 'Time since trouble codes cleared',
        dimension: 'min',
      },
      56: {
        label: 'Absolute fuel rail pressure',
        dimension: 'kPa*10',
      },
      57: {
        label: 'Hybrid battery pack remaining life',
        dimension: '%',
      },
      58: {
        label: 'Engine oil temperature',
        dimension: 'C',
      },
      59: {
        label: 'Fuel injection timing',
        dimension: 'O, *0.01',
      },
      60: {
        label: 'Engine fuel rate',
        dimension: 'L/h, *100',
      },
      61: { //
        label: 'Geofence zone 06',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      62: { //
        label: 'Geofence zone 07',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      63: { //
        label: 'Geofence zone 08',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      64: { //
        label: 'Geofence zone 09',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      65: { //
        label: 'Geofence zone 10',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      66: { //
        label: 'External Voltage',
        dimension: 'mV',
      },
      67: { //
        label: 'Battery Voltage',
        dimension: 'mV',
      },
      68: { //
        label: 'Battery Current',
        dimension: 'mA',
      },
      69: { //
        label: 'GNSS Status',
        values: {
          0: 'GNSS OFF',
          1: 'GNSS ON with fix',
          2: 'GNSS ON without fix',
          3: 'GNSS sleep',
        },
      },
      70: { //
        label: 'Geofence zone 11',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      71: { //
        label: 'Dallas Temperature ID 4',
      },
      72: { //
        label: 'Dallas Temperature 1',
        dimension: 'C'
      },
      73: { //
        label: 'Dallas Temperature 2',
        dimension: 'C'
      },
      74: { //
        label: 'Dallas Temperature 3',
        dimension: 'C'
      },
      75: { //
        label: 'Dallas Temperature 4',
        dimension: 'C'
      },
      76: { //
        label: 'Dallas Temperature ID 1',
      },
      77: { //
        label: 'Dallas Temperature ID 2',
      },
      78: { //
        label: 'iButton',
      },
      79: { //
        label: 'Dallas Temperature ID 3',
      },
      80: { //
        label: 'Data Mode',
        values: {
          0: 'Home On Stop',
          1: 'Home On Moving',
          2: 'Roaming On Stop',
          3: 'Roaming On Moving',
          4: 'Unknown On Stop',
          5: 'Unknown On Moving',
        },
      },
      86: {
        label: 'BLE 1 Humidity',
        dimension: '%RH',
      },
      88: { //
        label: 'Geofence zone 12',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      91: { //
        label: 'Geofence zone 13',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      92: { //
        label: 'Geofence zone 14',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      93: { //
        label: 'Geofence zone 15',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      94: { //
        label: 'Geofence zone 16',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      95: { //
        label: 'Geofence zone 17',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      96: { //
        label: 'Geofence zone 18',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      97: { //
        label: 'Geofence zone 19',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      98: { //
        label: 'Geofence zone 20',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      99: { //
        label: 'Geofence zone 21',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      104: {
        label: 'BLE 2 Humidity',
        dimension: '%RH',
      },
      106: {
        label: 'BLE 3 Humidity',
        dimension: '%RH',
      },
      108: {
        label: 'BLE 4 Humidity',
        dimension: '%RH',
      },
      113: { //
        label: 'Battery Level',
        dimesion: '%',
      },
      153: { //
        label: 'Geofence zone 22',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      154: { //
        label: 'Geofence zone 23',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      155: { //
        label: 'Geofence zone 01',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      156: { //
        label: 'Geofence zone 02',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      157: { //
        label: 'Geofence zone 03',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      158: { //
        label: 'Geofence zone 04',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      159: { //
        label: 'Geofence zone 05',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        }
      },
      175: { //
        label: 'Auto Geofence',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
        },
      },
      179: { //
        label: 'Dout 1',
        values: {
          0: '0',
          1: '1',
        }
      },
      180: { //
        label: 'Dout 2',
        values: {
          0: '0',
          1: '1',
        }
      },
      181: { //
        label: 'GNSS PDOP',
      },
      182: { //
        label: 'GNSS HDOP',
      },
      190: { //
        label: 'Geofence zone 24',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      191: { //
        label: 'Geofence zone 25',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      192: { //
        label: 'Geofence zone 26',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      193: { //
        label: 'Geofence zone 27',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      194: { //
        label: 'Geofence zone 28',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      195: { //
        label: 'Geofence zone 29',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      196: { //
        label: 'Geofence zone 30',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      197: { //
        label: 'Geofence zone 31',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      198: { //
        label: 'Geofence zone 32',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      199: { //
        label: 'Trip Odometer',
        dimension: 'm',
      },
      200: { //
        label: 'Sleep Mode',
        values: {
          0: 'Sleep modes disabled',
          1: 'GPS Sleep',
          2: 'Deep Sleep',
          3: 'Online Deep Sleep',
          4: 'Ultra Deep Sleep',
        },
      },
      205: { //
        label: 'GSM Cell ID',
      },
      206: { //
        label: 'GSM Area Code',
      },
      208: { //
        label: 'Geofence zone 33',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      209: { //
        label: 'Geofence zone 34',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      216: { //
        label: 'Geofence zone 35',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      217: { //
        label: 'Geofence zone 36',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      218: { //
        label: 'Geofence zone 37',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      219: { //
        label: 'Geofence zone 38`',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      220: { //
        label: 'Geofence zone 39',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      221: { //
        label: 'Geofence zone 40',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      222: { //
        label: 'Geofence zone 41',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      223: { //
        label: 'Geofence zone 42',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      224: { //
        label: 'Geofence zone 43',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      225: { //
        label: 'Geofence zone 44',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      226: { //
        label: 'Geofence zone 45',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      227: { //
        label: 'Geofence zone 46',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      228: { //
        label: 'Geofence zone 47',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      229: { //
        label: 'Geofence zone 48',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      230: { //
        label: 'Geofence zone 49',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      231: { //
        label: 'Geofence zone 50',
        values: { 	
          0: 'target left zone',
          1: 'target entered zone',
          2: 'over speeding end',
          3: 'over speeding start',
        },
      },
      238: {
        label: 'User ID',
      },
      239: {  //
        label: 'Ignition',
        values: {
          0: 'Ignition Off',
          1: 'Ignition On',
        },
      },
      240: {  //
        label: 'Movement',
        values: {
          0: 'Movement Off',
          1: 'Movement On',
        },
      },
      241: { //
        label: 'Active GSM Operator',
      },
      242: { //
        label: '	ManDown/FallDown',
        values: {
          0: 'ManDown/FallDown deactivated',
          1: 'ManDown/FalDown is active',
        },
      },
      243: { //
        label: 'Green Driving Event Duration',
        dimension: 'ms',
      },
      246: { //
        label: 'Towing Detection Event',
        values: {
          0: 'Steady',
          1: 'Towing',
        },
      },
      247: { //
        label: 'Crash Detection',
        values: {   	
          1: 'crash',
          2: 'limited crash trace (device not calibrated)',
          3: 'limited crash trace (device is calibrated)',
          4: 'full crash trace (device not calibrated)',
          5: 'full crash trace (device is calibrated)',
          6: 'crash detected (device not calibrated)',
        },
      },
      248: { //
        label: 'Immobilizer',
        values: {     	
          0: 'iButton not connected',
          1: 'iButton connected (Immobilizer)',
          2: 'iButton connected (Authorized Driving)',
        }
      },
      249: { //
        label: 'Jamming',
        values: {
          0: 'Jamming Stop',
          1: 'Jamming Start',
        },
      },
      250: { //
        label: 'Trip',
        values: {
          0: 'Trip Stop',
          1: 'Trip Start',
        },
      },
      251: { //
        label: 'Idling',
        values: {
          0: 'Moving',
          1: 'Idling',
        },
      },
      252: {
        label: 'Unplug Event',
        values: {
          1: 'Send when unplug event happens',
        },
      },
      253: { //
        label: 'Green Driving Type',
        values: {
          1: 'Harsh Acceleration',
          2: 'Harsh Braking',
          3: 'Harsh Cornering',
        },
      },
      254: { //
        label: 'Green Driving Value',
        dimension: 'g*.01 | rad',
      },
      255: { //
        label: 'Overspeeding Event',
        dimension: 'km/h',
      },
      256: {
        label: 'VIN',
      },
      257: { //
        label: 'Crash trace data',
      },
      262: { //
        label: 'Din 4',
        values: {
          0: '0',
          1: '1',
        }
      },
      281: {
        label: 'fault codes',
      },
      303: { //
        label: 'Instant Movement',
        values: {
          0: '0',
          1: '1',
        }
      },
      386: { //
        label: 'Last Known Position',
        dimension: 's'
      },
      387: { //
        label: 'ISO6709 Coordinates',
      },
      800: { //
        label: 'Extended External Voltage',
        dimension: 'V',
      },
      801: { //
        label: 'Park Brake',
        values: {
          0: 'Disengaged',
          1: 'Engaged',
          2: 'Error',
          3: 'Unused',
        },
      },
      802: { //
        label: 'Selected',
        values: {
          0: 'Disengaged',
          1: 'Engaged',
          2: 'Error',
          3: 'Unused',
        },
      },
      803: { //
        label: 'Selected Charger Mode',
        values: {
          0: 'Default',
          1: 'Fast',
        },
      },
      804: { //
        label: 'Charger Voltage',
        dimension: 'mV',
      },
      805: { //
        label: 'Charger Current',
        dimension: 'mA',
      },
      806: { //
        label: 'Charger Control Mode',
        values: {
          0: 'Remote Control C-V-Limiting',
          1: 'Open Circuit',
        },
      },
      807: { //
        label: 'Charger BMS COM Timeout',
        values: {
          0: 'Expired',
          1: 'Not Expired',
        },
      },
      808: { //
        label: 'Charger CRC Violation',
        values: {
          0: 'No CRC Violation happened',
          1: 'CRC Violation happened',
        },
      },
      809: { //
        label: 'Charger MC Violation',
        values: {
          0: 'No MC Violation happened',
          1: 'MC Violation happened',
        },
      },
      810: { //
        label: 'Charger Status',
        values: {
          0: 'No Error',
          1: 'Minimal Current Limiting',
          2: 'Reverse Polarity',
          3: 'Reserved',
          4: 'Cable Voltage Drop',
          5: 'Fan Error',
          6: 'AC Undervoltage Disconnect',
          7: 'Not Ready For Charging',
        },
      },
      811: { //
        label: 'Charger Voltage Actual',
        dimension: 'mV',
      },
      812: { //
        label: 'Charger Internal Fault',
        dimension: 'mV',
        values: {
          0: 'Internal Fault happened',
          1: 'No Internal Fault happened',
        },
      },
      813: { //
        label: 'Charger Energyl',
        dimension: 'Wh',
      },
      814: { //
        label: 'Charger Current Actual',
        dimension: 'mA',
      },
      815: { //
        label: 'Throttle Position',
        dimension: '%',
      },
      816: { //
        label: 'Brake Pressed',
        values: {
          0: 'Brake Pressed',
          1: 'Brake Not Pressed',
        },
      },
      817: { //
        label: 'Charge Plug',
        values: {
          0: 'Charger Plugged',
          1: 'Charger not Plugged',
        },
      },
      818: { //
        label: 'Kill Switch Active',
        values: {
          0: 'Kill Switch Active',
          1: 'Kill Switch Not Active',
        },
      },
      819: { //
        label: 'Kickstand Release',
        values: {
          0: 'Kickstand Released',
          1: 'Kickstand not Released',
        },
      },
      820: { //
        label: 'Powerstrain State',
        values: {
          0: 'Off',
          1: 'Booting',
          2: 'Ready',
          3: 'Drive',
          4: 'Charge',
          5: 'Shutdown',
          6: 'Error',
        },
      },
      821: { //
        label: 'Malfunction Indicator',
        values: {
          0: 'Malfunction Indicator Not Active',
          1: 'Malfunction Indicator Active',
        },
      },
      822: { //
        label: 'Current Range',
      },
      823: { //
        label: 'SoH Battery',
        dimension: '%',
      },
      824: { //
        label: 'SoC Battery',
        dimension: '%',
      },
      825: { //
        label: 'Vehicle Available',
        values: {
          0: 'Vehicle Not Available',
          1: 'Vehicle Available',
        },
      },
      826: { //
        label: 'Charging Active',
        values: {
          0: 'Charging Not Active',
          1: 'Charging Active',
        },
      },
      827: { //
        label: 'Remaining Charge Time',
        dimension: 'min',
      },
      828: { //
        label: 'Remaining Capacity',
        dimension: 'Ah',
      },
      829: { //
        label: 'Full Charge Capacity',
        dimension: 'Ah',
      },
      830: { //
        label: 'Driving direction',
        values: {
          0: 'Park',
          1: 'Reverse',
          2: 'Forward',
          3: 'Neutral',
        },
      },
      831: { //
        label: 'Drive Mode',
        values: {
          0: 'Go',
          1: 'Cruise',
          2: 'Boost',
          3: 'Reserved',
        },
      },
      832: { //
        label: 'Drive Mode',
        values: {
          0: 'Park Brake Not Active',
          1: 'Park Brake Active',
        },
      },
      833: { //
        label: 'Total Distance',
        dimension: 'km',
      },
      834: { //
        label: 'Trip Distance',
        dimension: 'm',
      },
      835: { //
        label: 'Vehicle speed',
        dimension: 'km/h',
      },
      836: { //
        label: 'Ignition Status',
        values: {
          0: 'IGN_LOCK',
          1: 'IGN_OFF',
          2: 'IGN_ACC',
          3: 'Free',
          4: 'IGN_ON',
          5: 'IGN_START',
          6: 'LeM_NM:IGN_OFF',
          7: 'LeM_NM:IGN_ON',
        },
      },
      837: { //
        label: 'Ignition Fast Status',
        values: {
          0: 'Ignition Not Active',
          1: 'Ignition Active',
        },
      },
      838	: { //	
	        label: 	'Power Consumption',
	        dimension:	 'Wh/km',
	      },	

      838: { //
        label: 'Power Consumption',
        dimension: 'Wh/km',
      },
      839: { //
        label: 'Extended Analog Input 1',
        dimension: 'V',
      },
      840: { //
        label: 'Extended Analog Input 2',
        dimension: 'V'
      },
      841: { //
        label: 'Dout 1 Overcurrent',
        values: {
          0: 'No',
          1: 'Yes',
        },
      },
      842: { //
        label: 'Dout 2 Overcurrent',
        values: {
          0: 'No',
          1: 'Yes',
        },
      },
      843: { //
        label: 'Helmet Status',
        values: {
          0: 'Not in',
          1: 'In',
        },
      },
      844: { //
        label: 'Top Case Sensor',
        values: {
          0: 'Closed',
          1: 'Open',
        },
      },
      845: { //
        label: 'Central Stand Up',
        values: {
          0: 'Down',
          1: 'Up',
        },
      },
      846: { //
        label: 'Emergency',
        values: {
          0: 'No Emergency',
          1: 'Emergency',
        },
      },
      847: { //
        label: 'Over-Under Temperature',
        values: {
          0: 'normal temperature',
          1: 'over-under temperature',
        },
      },
      848: { //
        label: 'Regeneration Disabled',
        values: {
          0: 'enabled',
          1: 'disabled',
        },
      },
      849: { //
        label: 'Battery On/Off',
        values: {
          0: 'Battery Off',
          1: 'Battery On',
        },
      },
      850: { //
        label: 'Warning UnderVoltage',
        values: {
          0: 'no battery undervoltage', 
          1: 'battery undervoltage',
        },
      },
      851: { //
        label: 'Warning OverVoltage',
        values: {
          0: 'no battery overvoltage', 
          1: 'battery overvoltage',
        },
      },
      852: { //
        label: 'Warning OverCurrent',
        values: {
          0: 'No battery overcurrent', 
          1: 'battery overcurrent',
        },
      },
      853: { //
        label: 'Warning Short Circuit',
        values: {
          0: 'No battery short circuit', 
          1: 'battery short circuit',
        },
      },
      900: { //
        label: 'Manual CAN 0',
      },
      901: { //
        label: 'Manual CAN 1',
      },
      902: { //
        label: 'Manual CAN 2',
      },
      903: { //
        label: 'Manual CAN 3',
      },
      904: { //
        label: 'Manual CAN 4',
      },
      905: { //
        label: 'Manual CAN 5',
      },
      906: { //
        label: 'Manual CAN 6',
      },
      907: { //
        label: 'Manual CAN 8',
      },
      909: { //
        label: 'Manual CAN 9',
      },
      910: { //
        label: 'Manual CAN 10',
      },
      911: { //
        label: 'Manual CAN 11',
      },
      912: { //
        label: 'Manual CAN 12',
      },
      913: { //
        label: 'Manual CAN 13',
      },
      914: { //
        label: 'Manual CAN 14',
      },
      915: { //
        label: 'Manual CAN 15',
      },
      916: { //
        label: 'Manual CAN 16',
      },
      917: { //
        label: 'Manual CAN 17',
      },
      918: { //
        label: 'Manual CAN 18',
      },
      919: { //
        label: 'Manual CAN 19',
      },
      920: { //
        label: 'Manual CAN 20',
      },
      921: { //
        label: 'Manual CAN 21',
      },
      922: { //
        label: 'Manual CAN 22',
      },
      923: { //
        label: 'Manual CAN 23',
      },
      924: { //
        label: 'Manual CAN 24',
      },
      925: { //
        label: 'Manual CAN 25',
      },
      926: { //
        label: 'Manual CAN 26',
      },
      927: { //
        label: 'Manual CAN 27',
      },
      928: { //
        label: 'Manual CAN 28',
      },
      929: { //
        label: 'Manual CAN 29',
      },
      930: { //
        label: 'Accelerator Pedal 1 Low Idle Switch',
        values: {
          0: 'Accelerator pedal 1 not in low idle condition',
          1: 'Accelerator pedal 1 in low idle condition',
          2: 'Error',
          3: 'Not available',
        },
      },
      931: { //
        label: 'Accelerator Pedal Kickdown Switch',
        values: {
          0: 'Kickdown passive',
          1: 'Kickdown active',
          2: 'Error',
          3: 'Not available',
        },
      },
      932: { //
        label: 'Road Speed Limit Status',
        values: {
          0: 'Active',
          1: 'Not Active',
          2: 'Error',
          3: 'Not available',
        },
      },
      933: { //
        label: 'Accelerator Pedal 2 Low Idle Switch',
        values: {
          0: 'Accelerator pedal 2 not in low idle condition',
          1: 'Accelerator pedal 2 in low idle condition',
          2: 'Error',
          3: 'Not available',
        },
      },
      934: { //
        label: 'Accelerator Pedal Position 1',
        dimension: '%'
      },
      936: { //
        label: 'Engine Percent Load At Current Speed',
        dimension: '%'
      },
      937: { //
        label: 'Remote Accelerator Pedal Position',
        dimension: '%'
      },
      938: { //
        label: 'Accelerator Pedal 2 Position',
        dimension: '%'
      },
      939: { //
        label: 'Accelerator Pedal 2 Low Idle Switch',
        values: {
          0: 'Limit not active',
          1: 'Limit active',
          2: 'Reserved',
          3: 'Not available',
        },
      },
      940: { //
        label: 'Momentary Engine Maximum Power Enable Feedback',
        values: {
          0: 'disabled',
          1: 'supported',
          2: 'reserved',
          3: 'dont care',
        },
      },
      941: { //
        label: 'DPF Thermal Management Active',
        values: {
          0: 'DPF Thermal Management is not active',
          1: 'DPF Thermal Management is active',
          2: 'Reserved',
          3: 'Dont care',
        },
      },
      1121: { //
        label: 'CAN Unlocked',
        values: {
          0: 'No',
          1: 'Yes',
        },
      },
      1122: { //
        label: 'BMS2 Temperature Current Max',
        dimension: '˚C'
      },
      1123: { //
        label: 'BMS2 Temperature Current Min',
        dimension: '˚C'
      },
      1124: { //
        label: 'BMS2 Voltage Cell Min',
        dimension: 'mV'
      },
      1125: { //
        label: 'BMS2 Voltage Cell Max',
        dimension: 'mV'
      },
      1100: { //
        label: 'BMS0 Temperature Current Max',
        dimension: '˚C'
      },
      1101: { //
        label: 'BMS0 Temperature Current Min',
        dimension: '˚C'
      },
      11002: { //
        label: 'BMS0 Voltage Cell Min',
        dimension: 'mV'
      },
      11003: { //
        label: 'BMS0 Voltage Cell Max',
        dimension: 'mV'
      },
      1104: { //
        label: 'BMS1 Temperature Current Max',
        dimension: '˚C'
      },
      1105: { //
        label: 'BMS1 Temperature Current Min',
        dimension: '˚C'
      },
      1106: { //
        label: 'BMS1 Voltage Cell Min',
        dimension: 'mV'
      },
      1107: { //
        label: 'BMS1 Voltage Cell Max',
        dimension: 'mV'
      },
      
      /* 113:{
                 label:"Battery Level"
             },
             116:{
                 label:"Charger Connected"
             },
             82:{
                 label:"Accelerator Pedal Position"
             },
             87:{
                 label:"Total Mileage"
             }*/
    };
  }
}

module.exports = Codec8e;