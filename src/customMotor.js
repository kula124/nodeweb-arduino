const dcMotor = require('./motor')
const five = require('johnny-five')

class cMotor {
  constructor (settings) {
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
    const { dir, cdir, pwm } = this.motorPins
    dir.high()
    cdir.low()
    pwm.brightness(value)
  }

  stop () {
    const { dir, cdir, pwm } = this.motorPins
    five.Pin.write(dir, 0)
    five.Pin.write(cdir, 0)
    five.Pin.write(pwm, 0)
  }

  reverse (value) {
    const { dir, cdir, pwm } = this.motorPins
    cdir.high()
    dir.low()
    pwm.brightness(value)
  }
}

module.exports = cMotor
