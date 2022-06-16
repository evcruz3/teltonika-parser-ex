console.log("hello world")
let amount = randomIntFromInterval(1000,5000)
console.log(`sleeping for ${amount} ms...`)
sleep(amount)
console.log("goodbye world")

async function sleep(time){
    await new Promise(resolve => setTimeout(resolve, 5000));
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}


