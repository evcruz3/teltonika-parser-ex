'use strict';

module.exports = function(console){
    const originalConsoleLog = console.log;
    console.log = function() {
        args = [];
        args.push( '[' + (new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})) + '] ' );
        // Note: arguments is part of the prototype
        for( var i = 0; i < arguments.length; i++ ) {
            args.push( arguments[i] );
        }
        originalConsoleLog.apply( console, args );
    };

    return console
}