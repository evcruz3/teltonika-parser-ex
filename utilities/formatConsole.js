'use strict';

function formatConsole() {
    console.log("ASDASD")
    let args = []
    args.push( '[' + (new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})) + '] ' );
        // Note: arguments is part of the prototype
    for( var i = 0; i < arguments.length; i++ ) {
        args.push( arguments[i] );
    }

    return args
};

module.exports = formatConsole;