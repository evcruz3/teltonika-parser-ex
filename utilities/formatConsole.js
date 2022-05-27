'use strict';

function formatConsole() {
    const originalConsoleLog = console.log;
    let args = [];
    args.push( '[' + (new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})) + '] ' );
    // Note: arguments is part of the prototype
    for( var i = 0; i < arguments.length; i++ ) {
        args.push( arguments[i] );
    }
    originalConsoleLog.apply( console, args );

    return originalConsoleLog
};

module.exports = formatConsole;