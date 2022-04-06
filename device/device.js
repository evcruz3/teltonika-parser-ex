'use strict';

class Device{
   /** 
    * Device constructor
    *
    */ 
   constructor(id, socket){
      this.id = id;
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

}

module.exports = Device;