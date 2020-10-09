const dcMotor = require('./motor')
const five = require('johnny-five')

class cMotor extends dcMotor {
  constructor (settings) {
    super(settings)
    this.motorPins = {
      dir: new five.Pin({
        pin: settings.pins.dir,
        type: 'digital'
      }),
      cdir: new five.Pin({
        pin: settings.pins.cdir,
        type: 'digital'
      }),
      pwm: new five.Pin({
        pin: settings.pins.pwm,
        mode: five.Pin.pwm
      })
    }
  }

  forward (value) {
    const { dir, pwm } = this.motorPins
    five.Pin.write(dir, 1)
    console.log('cMotor -> forward -> value', value)
    five.Pin.write(pwm, value)
  }

  stop () {
    const { dir, pwm, cdir } = this.motorPins
    five.Pin.write(dir, 0)
    five.Pin.write(cdir, 0)
    five.Pin.write(pwm, 0)
  }

  reverse (value) {
    const { cdir, pwm } = this.motorPins
    five.Pin.write(cdir, 1)
    five.Pin.write(pwm, value)
  }
}

module.exports = cMotor
