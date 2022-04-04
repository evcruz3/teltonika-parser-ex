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
       this.devices[this.id] = d;
       this.id = this.id + 1;
   }

   getDevices(){
      return this.devices;
   }

   getDeviceByID(id){
       return this.devices[id];
   }

   getDeviceBySocket(socket){
       return this.devices.findIndex(socket)
    }

   sendMessageToDevice(id, message){
       this.devices[id].sendCommand(message)
   }

   removeDeviceBySocket(socket){
       let id = this.devices.findIndex(socket)
       this.devices.splice(id, 1)
   }

   
}

module.exports = Devices;