const five = require('johnny-five')
const motorAction = require('./constants/motor')
const servoAction = require('./constants/servo')
const DcMotor = require('./customMotor')
// const motor = require('./motor')([process.env.DCMOTOR_PIN_PWM, process.env.DCMOTOR_PIN_D1, process.env.DCMOTOR_PIN_D2])

const motor = new DcMotor({
  // config: five.Motor.SHIELD_CONFIGS.POLOLU_DRV8835_SHIELD,
  pins: {
    pwm: process.env.DCMOTOR_PIN_PWM,
    dir: process.env.DCMOTOR_PIN_D2,
    cdir: process.env.DCMOTOR_PIN_D1
  }
})

const servo = new five.Servo({
  pin: process.env.SERVO_PIN,
  startAt: process.env.SERVO_BALANCE_ANGLE,
  range: [0, 180],
  center: true
})

function act (type, data) {
  console.log(type, data)
  switch (type) {
    case motorAction.FORWARD:
      motor.forward(data)
      break
    case motorAction.REVERSE:
      motor.reverse(data)
      break
    case motorAction.SWITCH:
      motor.switchSide()
      break
    case motorAction.STOP:
      motor.stop()
      break
    case servoAction.RIGHT:
      servo.to(parseInt(servo.startAt) + parseInt(data)) // Gotta love JS amIrite
      break
    case servoAction.LEFT:
      servo.to(servo.startAt - data)
      break
    case servoAction.RESET:
      servo.to(servo.startAt)
  }
}

module.exports = {
  act
}
