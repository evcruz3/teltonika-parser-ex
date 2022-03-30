const Parser = require('teltonika-parser-ex');
const binutils = require('binutils64');
const net = require('net');
const { parse } = require('path');

var id = 0;

let server = net.createServer((c) => {
    console.log("client connected");

    //c.id = id++; 
    c.on('end', () => {
        console.log("client disconnected");
        clients
    });

    c.on('data', (data) => {
        console.log(data);
        let buffer = data;
        let parser = new Parser(buffer);
        if(parser.isImei){
            console.log("Received data is IMEI from " + c.remoteAddress + ":" + c.remotePort);
            c.write(Buffer.alloc(1, 1));
        }else {
            let avl = parser.getAvl();
            if(avl.codec_id == 12){
                console.log("Received GPRS response")
                let gprs = parser.getGprs()
                console.log(gprs.response)
            }
            else{
                console.log("Received data is AVL  from " + c.remoteAddress + ":" + c.remotePort);
                
                console.log("Zero: " + avl.zero);
                console.log("Data Length: " + avl.data_length);
                console.log("Codec ID: " + avl.codec_id);
                console.log("Number of Data: " + avl.number_of_data);
                let writer = new binutils.BinaryWriter();
                writer.WriteInt32(avl.number_of_data);

                //let response = writer.ByteBuffer;
                let response = Buffer.from("000000000000000F0C010500000007676574696E666F0100004312", "hex")
                console.log("Writing test command " + response.toString("hex"));
                c.write(response);
            }
            
        }
    });
});

server.listen(49366, () => {
    console.log("Server started");
});
