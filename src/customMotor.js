const dcMotor = require('./motor')
const five = require('johnny-five')

class cMotor {
  constructor (settings) {
    console.log('cMotor -> constructor -> settings', settings)
    this.motorPins = {
      dir: new five.Pin({
        pin: settings.pins.dir,
        type: 'digital'
      }),
      cdir: new five.Pin({
        pin: settings.pins.cdir,
        type: 'digital'
      }),
      pwm: new five.Led({
        pin: settings.pins.pwm,
      })
    }
  }

  forward (value) {
    this.motorPins.dir.high()
    this.motorPins.cdir.low()
    this.motorPins.pwm.brightness(value)
  }

  stop () {
    this.motorPins.dir.low()
    this.motorPins.cdir.low()
    this.motorPins.pwm.brightness(0)
  }

  reverse (value) {
    this.motorPins.cdir.high()
    this.motorPins.dir.low()
    this.motorPins.pwm.brightness(value)
  }
}

module.exports = cMotor
