'use strict';

class Device{
   /** 
    * Device constructor
    *
    */ 
   constructor(id, imei, socket){
      this.id = id;
      this.imei = imei;
      this.socket = socket;
      this.isReady = false;
      this.avlRecords = [];
      this.gprsRecords = [];
   }

   sendCommand(message){
      if(this.isReady){
         let command_message = message;
         this.socket.write(command_message)
      }
      else {
         console.log("Device " + this.id + " is not yet ready for communication")
      }
      
   }

   getID(){
    return this.id;
   }

   getImei(){
      return this.imei;
   }

   updateSocket(socket){
      this.socket = socket
   }

   pushAvlRecord(avlObj){
      this.avlRecords.push(avlObj)
   }

   pushGprsRecord(gprsObj){
      this.gprsRecords.push(gprsObj)
   }

   printLatestGprs(){
      console.log(this.gprsRecords[-1].message)
   }

}

module.exports = Device;