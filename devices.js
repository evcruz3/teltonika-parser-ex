'use strict';
const Device = require('./device')

class Devices{
   /** 
    * Device constructor
    *
    */ 
   constructor(){
       this.id = 0
       this.devices = []
   }
   
   addDevice(socket){
       let d = new Device(this.id, socket);
       this.devices[this.id] = device;
       this.id = this.id + 1;
   }

   getDevices(){
      return this.devices;
   }

   getDeviceByID(id){
       return devices[id];
   }

   
}

module.exports = Devices;