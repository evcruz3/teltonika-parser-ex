'use strict';

class Device{
   /** 
    * Device constructor
    *
    */ 
   constructor(id, socket){
    this.id = id;
    this.socket = socket;
   }

   sendCommand(message){
    let command_message = message;
    this._socket.write(command_message)
   }

   getID(){
    return this.id;
   }
}

module.exports = Device;