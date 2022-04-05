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
       console.log("Success id assignment for connected device; id: " + this.id)
       console.log("addDevice: Remote Address: " + this.devices[this.id].socket.remoteAddress)
       this.id = this.id + 1;
   }

   getDevices(){
      return this.devices;
   }

   getDeviceByID(id){
       return this.devices[id];
   }

   getDeviceBySocket(socket){
       let id = this.devices.findIndex( (o) => { 
            return (o.socket.remoteAddress===socket.remoteAddress) && (o.socket.remotePort === socket.remotePort);
       });
       console.log("getDeviceBySocket return value: " + id)
       return id
    }

   sendMessageToDevice(id, message){
       this.devices[id].sendCommand(message)
   }

   removeDeviceBySocket(socket){
       let id = this.devices.findIndex( (o) => {
           return (o.socket.remoteAddress===socket.remoteAddress) && (o.socket.remotePort === socket.remotePort);
        });
       this.devices.splice(id, 1)
   }

   
}

module.exports = Devices;