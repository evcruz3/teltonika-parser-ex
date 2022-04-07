class Gprs{
    constructor(){
        this.preamble = null;
        this.data_size = null;
        this.codec_id = null;
        this.command_quantity_1 = null;
        this.message_type = null;
        this.message_size = null;
        this.imei = null; // for codec 14
        this.message = null;
        this.timestamp = null // for codec 13
        this.command_quantity_2 = null;
        this.crc = null;
    }
}

module.exports = Gprs