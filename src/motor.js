const five = require('johnny-five')

module.exports = (pins) =>  new five.Motor(pins);
