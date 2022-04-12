'use strict';

const { Console } = require("console");

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

   printLatestAvl(){
      let latest_id = this.avlRecords.length - 1
      let latest_record = this.avlRecords[latest_id]
      console.log("KEYS: " + Object.keys(latest_record))
      //console.log("Length: " + latest_record.data_length)
      console.log("Number of Data: " + latest_record.number_of_data)
      for (var i = 0; i < latest_record.number_of_data; i++) {
         this._printAvlRecord(latest_record.records, i);
       }
   }

   _printAvlRecord(avlRecords, index){
      let avlRecord = avlRecords[index]

      console.log("KEYS: " + Object.keys(avlRecord))
      console.log("Timestamp: " + avlRecord.timestamp)
      console.log("Priority: " + avlRecord.priority)
      for (const [key, value] of Object.entries(avlRecord.gps)) {
         console.log(`GPS ${key}: ${value}`);
      }
      //console.log("GPS: " + avlRecord.gps)
      console.log("Event ID: " + avlRecord.event_id)
      console.log("Properties Count " + avlRecord.properties_count)
      for (const [key, value] of Object.entries(avlRecord.ioElements)) {
         console.log(`GPS ${key}: ${value}`);
      }


   }

}

module.exports = Device;