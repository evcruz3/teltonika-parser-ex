'use strict';

const Devices = require('./devices');

var devices = new Devices();

devices.addDevice("Hello")

console.log(devices.getDevices())