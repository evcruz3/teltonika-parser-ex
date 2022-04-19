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
   
   addDevice(imei, socket, ID = null){
       if(ID != null){
        let d = new Device(ID, imei, socket);
        this.devices[ID] = d;
        this.id = ID + 1;
       }
       else{
        let d = new Device(this.id, imei, socket);
        this.devices[this.id] = d;
        this.id = this.id + 1;
       }
       
       
       //console.log("Success id assignment for connected device; id: " + this.id)
       //console.log("addDevice: Remote Address: " + this.devices[this.id].socket.remoteAddress + ":" + this.devices[this.id].socket.remotePort)
       
       return id
   }

   getDevices(){
      return this.devices;
   }

   getDeviceByID(id){
       return this.devices[id];
   }

   getDeviceBySocket(socket){
       let id = this.devices.findIndex( (o) => { 
           if (o !== undefined){
                return (o.socket.remoteAddress===socket.remoteAddress) && (o.socket.remotePort === socket.remotePort);
           }
           else{
               return -1
           }
            
       });
       //console.log("getDeviceBySocket return value: " + id)
       
       if(id > -1){
            return this.devices[id]
        }
        else{
            return null
        }
       
    }

    getDeviceByImei(imei){
        let id = this.devices.findIndex( (o) => { 
            if (o !== undefined){
                 return (o.imei===imei) && (o.imei === imei);
            }
            else{
                return -1
            }
             
        });
        //console.log("getDeviceBySocket return value: " + id)
        

        if(id > -1){
            return this.devices[id]
        }
        else{
            return null
        }
    }

    sendMessageToDevice(id, message){
        this.devices[id].sendCommand(message)
    }

    removeDeviceBySocket(socket){
        let id = this.devices.findIndex( (o) => { 
            if (o !== undefined){
                return (o.socket.remoteAddress===socket.remoteAddress) && (o.socket.remotePort === socket.remotePort);
            }
            else{
                return -1
            }
            
        });

        if(id > -1){
            this.devices.splice(id, 1)
        }
    }

    setDeviceReady(id, status=true){
        this.devices[id].isReady = status;
    }

    printDevices(){
        var table = []
        for (let [key, value] of Object.entries(this.devices)) {
            let id = key;
            let dev = value;
            let isConnected = "CONNECTED" ? dev.isReady : "DISCONNECTED";
            //console.log('Dev ID\tIMEI\t\t\tStatus')
            table.push({
                'ID' : id,
                'IMEI' : dev.imei,
                'STATUS' : isConnected
            })
            //console.log(`${id}\t${dev.imei}\t${dev.isReady}`);
        }
        console.table(table);
   }

    pushAvlRecord(id, avlObj){
        this.devices[id].pushAvlRecord(avlObj)
    }

    pushGprsRecord(id, gprsObj){
        this.devices[id].pushGprsRecord(gprsObj)
    }
   
    printLatestGprs(id){
        this.devices[id].printLatestGprs()
    }

    printLatestAvl(id){
        this.devices[id].printLatestAvl()
    }

    printAllAvl(id){
        this.devices[id].printAllAvl()
    }
}

module.exports = Devices;