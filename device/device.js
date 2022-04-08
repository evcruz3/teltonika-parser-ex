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

}

module.exports = Device;