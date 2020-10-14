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
    const { dir, pwm, cdir } = this.motorPins
    console.log('cMotor -> forward -> this.motorPins', this.motorPins)
    dir.high()
    cdir.low()
    pwm.brightness(value)
  }

  stop () {
    const { dir, pwm, cdir } = this.motorPins
    dir.low()
    cdir.low()
    pwm.brightness(0)
  }

  reverse (value) {
    const { dir, pwm, cdir } = this.motorPins
    cdir.high()
    dir.low()
    pwm.brightness(value)
  }
}

module.exports = cMotor
